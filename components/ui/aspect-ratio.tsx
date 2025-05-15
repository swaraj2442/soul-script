'use client';

import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio';
import * as React from 'react';

interface AspectRatioProps extends React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root> {
  /**
   * The ratio of width to height. For example, 16/9 for widescreen.
   * @default 1
   */
  ratio?: number;
}

/**
 * AspectRatio component maintains a consistent width/height ratio.
 * Useful for responsive images, videos, and other media.
 * 
 * @example
 * ```tsx
 * <AspectRatio ratio={16/9}>
 *   <img src="image.jpg" alt="A beautiful landscape" />
 * </AspectRatio>
 * ```
 */
const AspectRatio = React.forwardRef<
  React.ElementRef<typeof AspectRatioPrimitive.Root>,
  AspectRatioProps
>(({ ratio = 1, ...props }, ref) => (
  <AspectRatioPrimitive.Root
    ref={ref}
    ratio={ratio}
    {...props}
  />
));

AspectRatio.displayName = 'AspectRatio';

export { AspectRatio, type AspectRatioProps };
