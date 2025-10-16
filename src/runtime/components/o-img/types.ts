import type { ImgHTMLAttributes } from "vue";

type ScreenSizeOptions = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | (string & {});

type Placeholder = { quality?: number; } & (
    | { width: number; height?: number }
    | { width?: number; height: number }
);

export type OImgProps = {
    src?: string;
    alt?: string;
    role?: string;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    quality?: string | number;
    srcset?: number[] | number | `${number}px`;
    sizes?: Partial<Record<ScreenSizeOptions, string | number>> | string;
    placeholder?: Placeholder;
    preload?: boolean;
};
