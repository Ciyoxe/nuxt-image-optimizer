import type { Clamping, Time, Size } from './runtime/configs';

type ScreenSizeOptions = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
type FormatOptions = 'webp' | 'avif' | 'jpeg' | 'png';

type Sizes = Record<ScreenSizeOptions, Clamping>;

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
    domains: 'all' | 'local' | Array<string | RegExp>;
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
        xs: '<320',
        sm: '<640',
        md: '<768',
        lg: '<1024',
        xl: '<1280',
        xxl: '<1536',
    },
    domains: 'all',
};
