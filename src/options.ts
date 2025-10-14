import type { MediaQuery, Size, Time } from "./runtime/shared/configs";

type ScreenSizeOptions = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
type FormatOptions = 'webp' | 'avif' | 'jpeg' | 'png';

type Sizes = Record<ScreenSizeOptions, MediaQuery>;

type Format = {
    format: FormatOptions;
    quality: number;
    width: number;
    height: number;
};

type Cache = {
    maxSize: Size;
    storagePath: 'in-memory' | (string & {});
    queueSize: number;
    queueTimeout: Time;
};

type AutoRefresh = {
    maxAge: Time;
    queueSize: number;
    queueTimeout: Time;
};

export type ModuleConfig = {
    sizes: Sizes;
    format: Format;
    cache: Cache;
    autoRefresh: AutoRefresh;
    domains: string[];
};

export const defaultModuleConfig: Readonly<ModuleConfig> = {
    cache: {
        queueSize: 1000,
        queueTimeout: '5s',
        storagePath: 'in-memory',
        maxSize: '20MB',
    },
    autoRefresh: {
        maxAge: '30m',
        queueSize: 10,
        queueTimeout: '5s',
    },
    format: {
        format: 'webp',
        quality: 80,
        width: 8192,
        height: 8192,
    },
    sizes: {
        xs: 'width < 320px',
        sm: 'width < 640px',
        md: 'width < 768px',
        lg: 'width < 1024px',
        xl: 'width < 1280px',
        xxl: 'width < 1536px',
    },
    domains: [],
};
