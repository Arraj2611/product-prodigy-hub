"""
Prompt templates for AI service
"""
import os
from pathlib import Path

PROMPTS_DIR = Path(__file__).parent

def load_prompt(filename: str) -> str:
    """
    Load a prompt template from file
    
    Args:
        filename: Name of the prompt file (e.g., "bom_analysis.txt")
    
    Returns:
        Prompt template as string
    """
    prompt_path = PROMPTS_DIR / filename
    if not prompt_path.exists():
        raise FileNotFoundError(f"Prompt file not found: {prompt_path}")
    
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()

def format_prompt(template: str, **kwargs) -> str:
    """
    Format a prompt template with variables
    
    Args:
        template: Prompt template string with {variable} placeholders
        **kwargs: Variables to substitute
    
    Returns:
        Formatted prompt string
    """
    try:
        return template.format(**kwargs)
    except KeyError as e:
        raise ValueError(f"Missing required variable in prompt: {e}")

