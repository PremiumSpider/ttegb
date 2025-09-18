#!/usr/bin/env python3
"""
Script to extract individual Pokéball sprites from the user's actual sprite sheet.
This version is more flexible and can handle different sprite arrangements.
"""

from PIL import Image
import os
import numpy as np

def find_sprite_boundaries(image):
    """
    Analyze the image to find individual sprite boundaries.
    This works by detecting non-background pixels.
    """
    # Convert to numpy array for easier processing
    img_array = np.array(image)
    
    # If RGBA, use alpha channel; if RGB, detect non-gray pixels
    if img_array.shape[2] == 4:  # RGBA
        # Find pixels that are not transparent
        non_empty = img_array[:, :, 3] > 0
    else:  # RGB
        # Find pixels that are not gray background (assuming gray background)
        gray_bg = np.array([128, 128, 128])  # Common gray background
        non_empty = np.any(np.abs(img_array - gray_bg) > 30, axis=2)
    
    return non_empty

def extract_sprites_smart(input_image_path, output_dir="user_pokeball_sprites"):
    """
    Smart extraction that analyzes the actual image structure.
    """
    
    # Create output directory
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    try:
        # Open the sprite sheet
        sprite_sheet = Image.open(input_image_path)
        print(f"Loaded sprite sheet: {sprite_sheet.size}")
        
        width, height = sprite_sheet.size
        
        # Try different grid configurations based on common sprite sheet layouts
        possible_configs = [
            (8, 4),  # 8 cols, 4 rows (with partial last row)
            (10, 3), # 10 cols, 3 rows (alternative layout)
            (13, 2), # 13 cols, 2 rows
            (26, 1), # All in one row
        ]
        
        best_config = None
        best_sprite_size = 0
        
        # Find the configuration that gives the most reasonable sprite size
        for cols, rows in possible_configs:
            sprite_w = width // cols
            sprite_h = height // rows
            sprite_size = min(sprite_w, sprite_h)
            
            # Prefer configurations that give square-ish sprites
            if sprite_size > best_sprite_size and sprite_w > 16 and sprite_h > 16:
                best_config = (cols, rows)
                best_sprite_size = sprite_size
        
        if not best_config:
            # Fallback to the original assumption
            best_config = (8, 4)
        
        cols, rows = best_config
        sprite_width = width // cols
        sprite_height = height // rows
        
        print(f"Using grid configuration: {cols}x{rows}")
        print(f"Calculated sprite dimensions: {sprite_width}x{sprite_height}")
        
        sprite_count = 0
        extracted_sprites = []
        
        # Extract all possible sprite positions
        for row in range(rows):
            for col in range(cols):
                left = col * sprite_width
                top = row * sprite_height
                right = left + sprite_width
                bottom = top + sprite_height
                
                # Crop the potential sprite
                sprite = sprite_sheet.crop((left, top, right, bottom))
                
                # Check if this sprite contains meaningful content
                sprite_array = np.array(sprite)
                
                # Simple check: does this area have non-background pixels?
                if sprite_array.shape[2] == 4:  # RGBA
                    has_content = np.any(sprite_array[:, :, 3] > 50)  # Has non-transparent pixels
                else:  # RGB
                    # Check for non-gray pixels (assuming gray background)
                    gray_bg = np.array([128, 128, 128])
                    has_content = np.any(np.sum(np.abs(sprite_array - gray_bg), axis=2) > 50)
                
                if has_content:
                    extracted_sprites.append(sprite)
                    sprite_count += 1
                    
                    if sprite_count <= 26:  # Only save up to 26 sprites
                        output_path = os.path.join(output_dir, f"pokeball_{sprite_count:02d}.png")
                        sprite.save(output_path)
                        print(f"Saved sprite {sprite_count}: {output_path}")
        
        print(f"\nSuccessfully extracted {min(sprite_count, 26)} Pokéball sprites!")
        return min(sprite_count, 26)
        
    except FileNotFoundError:
        print(f"Error: Could not find input image '{input_image_path}'")
        print("Please save your sprite sheet image in this directory.")
        return 0
    except Exception as e:
        print(f"Error processing image: {e}")
        return 0

def main():
    print("Smart Pokéball Sprite Extractor")
    print("=" * 35)
    
    # Look for common image file names
    possible_files = [
        "pokeball_spritesheet.png",
        "pokeballs.png", 
        "sprite_sheet.png",
        "pokeball_sprites.png"
    ]
    
    input_file = None
    for filename in possible_files:
        if os.path.exists(filename):
            input_file = filename
            break
    
    if not input_file:
