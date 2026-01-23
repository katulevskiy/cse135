#!/usr/bin/env python3
"""
Generate themed paintings for projects in projects.json file with 800x451 dimensions.
"""

import os
import json
import time
import torch
import argparse
import random
from pathlib import Path
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
from PIL import Image


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate artistic paintings for projects in projects.json"
    )
    parser.add_argument(
        "--projects_file",
        type=str,
        default="projects.json",
        help="Path to projects JSON file",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="runwayml/stable-diffusion-v1-5",
        help="Hugging Face model ID to use for image generation",
    )
    parser.add_argument(
        "--override_existing",
        action="store_true",
        help="Override existing images if they already exist",
    )
    parser.add_argument(
        "--guidance_scale",
        type=float,
        default=7.5,
        help="Classifier-free guidance scale",
    )
    parser.add_argument(
        "--num_inference_steps", type=int, default=40, help="Number of denoising steps"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Base seed for reproducibility (will be offset for each project)",
    )
    parser.add_argument(
        "--style",
        type=str,
        default="random",
        choices=[
            "impressionist",
            "surrealist",
            "abstract",
            "cyberpunk",
            "fantasy",
            "renaissance",
            "random",
        ],
        help="Painting style to use for the images",
    )
    return parser.parse_args()


def load_projects(json_file):
    """Load projects from JSON file"""
    try:
        with open(json_file, "r") as f:
            projects = json.load(f)
        print(f"Loaded {len(projects)} projects from {json_file}")
        return projects
    except Exception as e:
        print(f"Error loading projects: {e}")
        return []


def load_model(model_id):
    """Load the Stable Diffusion model"""
    print(f"Loading model: {model_id}")

    # Check if CUDA is available
    device = "cuda" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float16 if device == "cuda" else torch.float32

    # Load the pipeline
    pipeline = StableDiffusionPipeline.from_pretrained(
        model_id,
        torch_dtype=torch_dtype,
        safety_checker=None,
    )

    # Use the DPM-Solver++ scheduler for faster inference
    pipeline.scheduler = DPMSolverMultistepScheduler.from_config(
        pipeline.scheduler.config, algorithm_type="dpmsolver++", solver_order=2
    )

    # Move to device
    pipeline = pipeline.to(device)

    # Enable attention slicing for lower memory usage
    pipeline.enable_attention_slicing()

    print(f"Model loaded successfully on {device}")

    return pipeline


def extract_theme_elements(project):
    """Extract theme elements from the project"""
    title = project.get("title", "")
    description = project.get("description", "")
    tags = project.get("tags", "").split(", ")

    # Extract key concepts from the title
    title_words = [
        word
        for word in title.split()
        if len(word) > 3
        and word.lower()
        not in ("with", "using", "based", "that", "this", "for", "and", "the")
    ]

    # Extract key technologies from tags
    tech_tags = []
    for tag in tags:
        if tag.lower() not in (
            "software",
            "development",
            "programming",
            "code",
            "application",
        ):
            tech_tags.append(tag)

    # Find interesting adjectives and nouns from description
    interesting_terms = []
    lower_desc = description.lower()

    for term in [
        "innovative",
        "creative",
        "dynamic",
        "modern",
        "intelligent",
        "interactive",
        "powerful",
        "efficient",
        "elegant",
        "seamless",
        "robust",
        "advanced",
        "visualization",
        "automation",
        "analysis",
        "collaboration",
        "communication",
        "security",
        "performance",
        "optimization",
        "interface",
        "experience",
        "data",
        "cloud",
        "network",
        "mobile",
        "web",
        "system",
        "platform",
    ]:
        if term.lower() in lower_desc:
            interesting_terms.append(term)

    # Get a few random words from description (fallback if nothing interesting found)
    if len(interesting_terms) < 2:
        desc_words = [word for word in description.split() if len(word) > 4]
        if desc_words:
            interesting_terms.extend(random.sample(desc_words, min(3, len(desc_words))))

    # Combine all elements
    theme_elements = title_words + tech_tags + interesting_terms

    # Remove duplicates while preserving order
    seen = set()
    unique_elements = []
    for item in theme_elements:
        if item.lower() not in seen:
            seen.add(item.lower())
            unique_elements.append(item)

    return unique_elements[:5]  # Return up to 5 elements


def get_painting_style(style="random"):
    """Get details for a specific painting style"""
    styles = {
        "impressionist": {
            "prompt": "impressionist painting style, vibrant brushstrokes, light and color play, outdoor scene, Monet-inspired, wide panoramic view",
            "artists": "Claude Monet, Pierre-Auguste Renoir, Edgar Degas",
        },
        "surrealist": {
            "prompt": "surrealist painting style, dreamlike imagery, impossible scenes, symbolic elements, wide landscape format",
            "artists": "Salvador Dali, René Magritte, Frida Kahlo",
        },
        "abstract": {
            "prompt": "abstract expressionist painting, bold colors, non-representational, emotional, dynamic horizontal composition",
            "artists": "Wassily Kandinsky, Jackson Pollock, Mark Rothko",
        },
        "cyberpunk": {
            "prompt": "cyberpunk digital art, neon colors, futuristic cityscape, high tech low life, wide cinematic view",
            "artists": "Simon Stålenhag, Josan Gonzalez, Syd Mead",
        },
        "fantasy": {
            "prompt": "fantasy concept art, magical atmosphere, epic panoramic scenery, detailed illustration, dramatic lighting",
            "artists": "Frank Frazetta, Alan Lee, John Howe",
        },
        "renaissance": {
            "prompt": "renaissance painting style, rich colors, dramatic lighting, classical landscape composition, detailed, realistic",
            "artists": "Leonardo da Vinci, Michelangelo, Raphael",
        },
    }

    if style == "random":
        style = random.choice(list(styles.keys()))

    return styles[style], style


def create_painting_prompt(project, style="random"):
    """Create a painting-style prompt based on project theme"""
    # Get theme elements
    theme_elements = extract_theme_elements(project)

    # Get painting style
    style_info, style_name = get_painting_style(style)

    # Create scene description based on theme elements
    if style_name in ["cyberpunk", "fantasy"]:
        scene = f"a {'futuristic panoramic' if style_name == 'cyberpunk' else 'magical landscape'} scene featuring {', '.join(theme_elements)}"
    elif style_name == "surrealist":
        scene = f"a dreamlike wide landscape with {', '.join(theme_elements)} floating in an impossible world"
    elif style_name == "renaissance":
        scene = f"a grand panoramic scene representing {', '.join(theme_elements)} with symbolic meaning"
    else:
        scene = f"a wide composition representing {', '.join(theme_elements)}"

    # Create the prompt
    prompt = f"A masterful {style_info['prompt']}, {scene}, in the style of {style_info['artists']}"

    # Add quality specifications
    prompt += ", masterpiece, highly detailed, professional artwork, widescreen format, 16:9 aspect ratio"

    return prompt, style_name


def generate_image_for_project(pipeline, project, args, index):
    """Generate a painting for a project with 800x451 dimensions"""
    project_id = project.get("id", f"project-{index}")
    image_path = project.get("image", f"assets/{project_id}.webp")

    # Create painting prompt
    prompt, style_name = create_painting_prompt(project, args.style)

    # Add a negative prompt to avoid unwanted elements
    negative_prompt = "text, words, letters, signature, watermark, logo, UI elements, interface, diagram, chart, table, ugly, blurry, distorted, deformed, pixelated, low quality, draft, portrait orientation, vertical composition"

    print(f"\nGenerating {style_name} painting for project: {project_id}")
    print(f"Using prompt: {prompt}")

    # Set seed for reproducibility
    if args.seed is not None:
        seed = args.seed + index
    else:
        seed = int(time.time()) + index

    generator = torch.Generator(device=pipeline.device).manual_seed(seed)
    print(f"Using seed: {seed}")

    # Generate the image with exact 800x451 dimensions (16:9 aspect ratio)
    image = pipeline(
        prompt=prompt,
        negative_prompt=negative_prompt,
        height=448,  # Exact height needed
        width=800,  # Exact width needed
        generator=generator,
        num_inference_steps=args.num_inference_steps,
        guidance_scale=args.guidance_scale,
    ).images[0]

    return image, image_path


def save_image(image, image_path, override_existing=False):
    """Save the generated image to the specified path"""
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(image_path), exist_ok=True)

    # Check if file already exists
    if os.path.exists(image_path) and not override_existing:
        print(
            f"Image already exists at {image_path}. Skipping. Use --override_existing to override."
        )
        return False

    # Convert to WebP if needed
    if image_path.endswith(".webp"):
        image.save(image_path, "WEBP", quality=90)
    else:
        image.save(image_path)

    print(f"Image saved to {image_path}")
    return True


def main():
    args = parse_args()

    # Load projects
    projects = load_projects(args.projects_file)
    if not projects:
        return

    # Load model
    pipeline = load_model(args.model)

    # Keep track of how many images were generated
    generated_count = 0

    # Generate images for each project
    for i, project in enumerate(projects):
        # Check if image already exists
        image_path = project.get("image", "")
        if os.path.exists(image_path) and not args.override_existing:
            print(
                f"Image already exists at {image_path}. Skipping. Use --override_existing to override."
            )
            continue

        # Generate image
        image, image_path = generate_image_for_project(pipeline, project, args, i)

        # Save image
        if save_image(image, image_path, args.override_existing):
            generated_count += 1

    print(
        f"\nGeneration complete! Generated {generated_count} images for {len(projects)} projects."
    )


if __name__ == "__main__":
    main()
