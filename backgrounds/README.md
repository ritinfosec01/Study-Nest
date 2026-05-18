# Custom Backgrounds

Drop any `.jpg` / `.png` / `.webp` image into this folder, then add its filename to `manifest.json`.

## Two formats accepted

**Simple — just filenames:**
```json
{ "images": ["mountains.jpg", "city-night.png"] }
```

**With custom labels:**
```json
{
  "images": [
    { "file": "mountains.jpg", "label": "Snowy Peaks" },
    { "file": "city-night.png", "label": "Tokyo @ Night" }
  ]
}
```

Save the file, refresh the page, and your images appear under **Background → Scenes** alongside the built-in gradients.
