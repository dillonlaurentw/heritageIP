export type TreeNode = {
  id: string;
  title: string;
  icon: string | null;
  href: string;
  kind: "PAGE" | "DATABASE";
  children: TreeNode[];
};

export type ShellWorkspace = { slug: string; name: string; icon: string | null };

export type PaletteItem = {
  id: string;
  label: string;
  group: string;
  href?: string;
  /** Named client action, handled by the palette (theme, new page…). */
  action?: string;
  hint?: string;
  icon?: string | null;
  keywords?: string;
};
