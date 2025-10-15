import type { Size, Time } from "./runtime/shared/configs";

type ScreenSizeOptions = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | (string & {});
type FormatOptions = 'webp' | 'avif' | 'jpeg' | 'png';

type Conversion = {
    format: FormatOptions;
    quality: number;
    width: number;
    height: number;
    cpuEffort: number;
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
    conversion: Conversion;
    cache: Cache;
    sizes: Record<ScreenSizeOptions, string>;
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
    conversion: {
        format: 'webp',
        quality: 80,
        width: 4096,
        height: 4096,
        cpuEffort: 6,
    },
    sizes: {
        xs: '(width < 320px)',
        sm: '(320px <= width < 640px)',
        md: '(640px <= width < 768px)',
        lg: '(768px <= width < 1024px)',
        xl: '(1024px <= width < 1280px)',
        xxl: '(width > 1280px)',
    },
    domains: [],
};
