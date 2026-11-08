# Vidéo TikTok « Encore une histoire ! » (HyperFrames)

Mini-film vertical 1080×1920, 34 s : à 20 h 47, Léo réclame encore une histoire ; sa maman connaît
tous les livres par cœur ; un soir, elle envoie une photo ; le lendemain, Léo découvre que le héros,
c'est lui (« Maman… c'est MOI ? ») et s'endort en serrant son livre.

- Images (fal, même personnage que le livre de démonstration de Léo, enfant fictif), voix off
  (ElevenLabs via fal, voix « Matilda ») et musique boîte à musique (Lyria 2 via fal) dans `assets/`.
- Modifier : `index.html`. Vérifier : `npx hyperframes@0.9.23 check`.
- Fabriquer : `npx hyperframes@0.9.23 render -o tiktok.mp4 -q delivery` (Node 22+, FFmpeg, Chrome).
