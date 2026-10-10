# Preserved references and actual comparison

- Original handoff video: ../phase-1/demo-nafas-cold-brew.mp4 (unchanged; signature in reference.sha256).
- before.mp4 and before-storyboard.json: current working output copied before this refactor.
- after.mp4: fresh full-resolution render of the same canonical brief after the refactor.
- comparison.json: complete 600-frame decoded comparison and complete PCM audio comparison.
- refactor-ssim.log / ssim-frames.log: aggregate and per-frame SSIM; inspected PNG pairs at 200, 380, 431.
- historical-comparison.json / historical-ssim.log: original handoff versus the pre-refactor current output.

Current refactor: 506/600 native decoded frames exact; 94 differ. Audio exact. Mean SSIM 0.999338,
minimum 0.990280 at frame 431. Inspected pairs show no obvious geometry, text or product change.
Exact pixel equivalence is NOT claimed; the residual differences' cause has not been isolated.

The historic original already differed from the pre-refactor output: all 600 frames differ, audio exact,
SSIM 0.995150. This is a separate baseline comparison, not evidence of differences introduced in this task.
No historical environment/encoding explanation is asserted without further isolation.
