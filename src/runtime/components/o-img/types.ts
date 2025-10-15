type DocumentStructureRole =
    | 'toolbar'
    | 'tooltip'
    | 'feed'
    | 'math'
    | 'presentation'
    | 'none'
    | 'note'
    | 'application'
    | 'article'
    | 'cell'
    | 'columnheader'
    | 'definition'
    | 'directory'
    | 'document'
    | 'figure'
    | 'group'
    | 'heading'
    | 'img'
    | 'list'
    | 'listitem'
    | 'meter'
    | 'row'
    | 'rowgroup'
    | 'rowheader'
    | 'separator'
    | 'table'
    | 'term'
    | 'associationlist'
    | 'associationlistitemkey'
    | 'associationlistitemvalue'
    | 'blockquote'
    | 'caption'
    | 'code'
    | 'deletion'
    | 'emphasis'
    | 'insertion'
    | 'paragraph'
    | 'strong'
    | 'subscript'
    | 'superscript'
    | 'time';

type WidgetRole =
    | 'scrollbar'
    | 'searchbox'
    | 'slider'
    | 'spinbutton'
    | 'switch'
    | 'tab'
    | 'tabpanel'
    | 'treeitem'
    | 'button'
    | 'checkbox'
    | 'gridcell'
    | 'link'
    | 'menuitem'
    | 'menuitemcheckbox'
    | 'menuitemradio'
    | 'option'
    | 'progressbar'
    | 'radio'
    | 'textbox';

type CompositeWidgetRole = 'combobox' | 'menu' | 'menubar' | 'tablist' | 'tree' | 'treegrid' | 'grid' | 'listbox' | 'radiogroup';

type LandmarkRole = 'banner' | 'complementary' | 'contentinfo' | 'form' | 'main' | 'navigation' | 'region' | 'search';

type LiveRegionRole = 'alert' | 'log' | 'marquee' | 'status' | 'timer';

type WindowRole = 'alertdialog' | 'dialog';

type AriaRole = '' | DocumentStructureRole | WidgetRole | CompositeWidgetRole | LandmarkRole | LiveRegionRole | WindowRole;

type ScreenSizeOptions = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | (string & {});

type Placeholder = { quality?: number } & ({ width: number; height?: number } | { width?: number; height: number });

export type OImgProps = {
    src?: string;
    alt?: string;
    role?: AriaRole | (string & {});
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    quality?: string | number;
    srcset?: number[] | number | `${number}px`;
    sizes?: Partial<Record<ScreenSizeOptions, string | number>>;
    placeholder?: Placeholder;
    loading?: 'lazy' | 'eager';
};
