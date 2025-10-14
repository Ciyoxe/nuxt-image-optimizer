type ScreenSizeOptions = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | (string & {});

export type OImgProps = {
    src?: string;
    alt?: string;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    quality?: string | number;
    srcset?: number[] | number | `${number}px`;
    sizes?: Partial<Record<ScreenSizeOptions, string | number>>;
    placeholder?: { quality?: number, width?: number, height?: number };
};
