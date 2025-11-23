"""
Groq Batch API Service
Handles batch processing for cost-efficient bulk operations
50% cost discount, higher rate limits, 24h-7d processing window
"""
import os
import json
import time
from typing import List, Dict, Any, Optional
from groq import Groq


class BatchService:
    """
    Service for managing Groq Batch API operations
    """
    
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        
        self.client = Groq(api_key=api_key)
        self.base_url = "https://api.groq.com/openai/v1"
    
    def create_batch_file(self, requests: List[Dict[str, Any]], file_path: str = None) -> str:
        """
        Create a JSONL batch file from a list of requests
        
        Args:
            requests: List of request dictionaries with custom_id, method, url, body
            file_path: Optional path to save the file (if None, creates temp file)
        
        Returns:
            Path to the created JSONL file
        """
        import tempfile
        
        if file_path is None:
            fd, file_path = tempfile.mkstemp(suffix='.jsonl', prefix='batch_')
            os.close(fd)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            for req in requests:
                f.write(json.dumps(req) + '\n')
        
        return file_path
    
    def upload_batch_file(self, file_path: str) -> Dict[str, Any]:
        """
        Upload a batch file to Groq Files API
        
        Args:
            file_path: Path to the JSONL file
        
        Returns:
            File object with id, bytes, created_at, etc.
        """
        with open(file_path, 'rb') as f:
            response = self.client.files.create(
                file=f,
                purpose="batch"
            )
        return response
    
    def create_batch_job(
        self,
        input_file_id: str,
        endpoint: str = "/v1/chat/completions",
        completion_window: str = "24h"
    ) -> Dict[str, Any]:
        """
        Create a batch job from an uploaded file
        
        Args:
            input_file_id: File ID from upload_batch_file
            endpoint: API endpoint (e.g., "/v1/chat/completions")
            completion_window: Processing window ("24h" to "7d")
        
        Returns:
            Batch object with id, status, etc.
        """
        response = self.client.batches.create(
            input_file_id=input_file_id,
            endpoint=endpoint,
            completion_window=completion_window
        )
        return response
    
    def get_batch_status(self, batch_id: str) -> Dict[str, Any]:
        """
        Get the status of a batch job
        
        Args:
            batch_id: Batch job ID
        
        Returns:
            Batch object with current status
        """
        response = self.client.batches.retrieve(batch_id)
        return response
    
    def get_batch_results(self, output_file_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve results from a completed batch job
        
        Args:
            output_file_id: Output file ID from batch status
        
        Returns:
            List of result dictionaries
        """
        response = self.client.files.content(output_file_id)
        
        # Read the JSONL content
        content = response.read()
        if isinstance(content, bytes):
            content = content.decode('utf-8')
        
        results = []
        for line in content.strip().split('\n'):
            if line:
                results.append(json.loads(line))
        
        return results
    
    def create_chat_completion_batch_requests(
        self,
        messages_list: List[List[Dict[str, str]]],
        model: str = "llama-3.3-70b-versatile",
        custom_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Create batch request format for chat completions
        
        Args:
            messages_list: List of message arrays (one per request)
            model: Model to use
            custom_ids: Optional list of custom IDs (auto-generated if not provided)
        
        Returns:
            List of batch request dictionaries
        """
        requests = []
        for i, messages in enumerate(messages_list):
            custom_id = custom_ids[i] if custom_ids and i < len(custom_ids) else f"request-{i+1}"
            
            requests.append({
                "custom_id": custom_id,
                "method": "POST",
                "url": "/v1/chat/completions",
                "body": {
                    "model": model,
                    "messages": messages,
                    "response_format": {"type": "json_object"}
                }
            })
        
        return requests
    
    def process_batch_sync(
        self,
        requests: List[Dict[str, Any]],
        endpoint: str = "/v1/chat/completions",
        completion_window: str = "24h",
        poll_interval: int = 5,
        max_wait_time: int = 300
    ) -> Dict[str, Any]:
        """
        Process a batch synchronously (wait for completion)
        
        Args:
            requests: List of batch request dictionaries
            endpoint: API endpoint
            completion_window: Processing window
            poll_interval: Seconds between status checks
            max_wait_time: Maximum time to wait in seconds
        
        Returns:
            Dictionary with batch_id, status, results, errors
        """
        # Create and upload batch file
        file_path = self.create_batch_file(requests)
        try:
            file_obj = self.upload_batch_file(file_path)
            input_file_id = file_obj.id
            
            # Create batch job
            batch = self.create_batch_job(
                input_file_id=input_file_id,
                endpoint=endpoint,
                completion_window=completion_window
            )
            batch_id = batch.id
            
            # Poll for completion
            start_time = time.time()
            while time.time() - start_time < max_wait_time:
                status = self.get_batch_status(batch_id)
                
                if status.status == "completed":
                    results = []
                    errors = []
                    
                    if status.output_file_id:
                        results = self.get_batch_results(status.output_file_id)
                    
                    if status.error_file_id:
                        errors = self.get_batch_results(status.error_file_id)
                    
                    return {
                        "batch_id": batch_id,
                        "status": "completed",
                        "results": results,
                        "errors": errors,
                        "request_counts": status.request_counts
                    }
                
                elif status.status in ["failed", "expired", "cancelled"]:
                    return {
                        "batch_id": batch_id,
                        "status": status.status,
                        "results": [],
                        "errors": status.errors or [],
                        "request_counts": status.request_counts
                    }
                
                # Wait before next poll
                time.sleep(poll_interval)
            
            # Timeout
            return {
                "batch_id": batch_id,
                "status": "timeout",
                "results": [],
                "errors": [{"message": f"Batch processing exceeded max wait time of {max_wait_time}s"}],
                "request_counts": {}
            }
        
        finally:
            # Clean up temp file
            if os.path.exists(file_path):
                os.remove(file_path)

