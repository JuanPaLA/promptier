import { Node as ProseMirrorNode } from 'prosemirror-model';
import { NodeView, ViewMutationRecord } from 'prosemirror-view';
import { sectionTagName } from '../../../../app/rendering/sectionTagName';

const COLLAPSED_CLASS = 'prompt-section-collapsed';

/**
 * Renders a section with a collapse toggle. Collapse is view-only state —
 * it never enters the document JSON, which stays purely semantic.
 */
export class SectionNodeView implements NodeView {
  readonly dom: HTMLElement;
  readonly contentDOM: HTMLElement;
  private readonly toggle: HTMLButtonElement;
  private readonly tagHint: HTMLElement;
  private collapsed = false;

  constructor(node: ProseMirrorNode) {
    this.dom = document.createElement('section');
    this.dom.className = 'prompt-section';
    this.dom.dataset.sectionId = node.attrs.id;

    this.toggle = document.createElement('button');
    this.toggle.type = 'button';
    this.toggle.className = 'prompt-section-toggle';
    this.toggle.contentEditable = 'false';
    this.toggle.setAttribute('aria-label', 'Toggle section');
    this.toggle.textContent = '▾';
    this.toggle.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.setCollapsed(!this.collapsed);
    });

    // Non-editable preview of the XML tag this section's title will render to.
    // Purely a hint: the document stays a semantic titled container, and the
    // markdown renderer is equally valid — this only shows the derived slug.
    this.tagHint = document.createElement('span');
    this.tagHint.className = 'prompt-section-tag';
    this.tagHint.contentEditable = 'false';
    this.tagHint.setAttribute('aria-hidden', 'true');

    this.contentDOM = document.createElement('div');
    this.contentDOM.className = 'prompt-section-content';

    this.dom.append(this.toggle, this.tagHint, this.contentDOM);
    this.renderTagHint(node);
  }

  update(node: ProseMirrorNode): boolean {
    if (node.type.name !== 'section') return false;
    this.dom.dataset.sectionId = node.attrs.id;
    this.renderTagHint(node);
    return true;
  }

  private renderTagHint(node: ProseMirrorNode): void {
    // First child is the sectionTitle node (grammar: `sectionTitle block+`).
    const title = node.firstChild?.textContent ?? '';
    this.tagHint.textContent = `<${sectionTagName(title)}>`;
  }

  stopEvent(event: Event): boolean {
    return event.target === this.toggle;
  }

  ignoreMutation(mutation: ViewMutationRecord): boolean {
    return !this.contentDOM.contains(mutation.target);
  }

  private setCollapsed(collapsed: boolean): void {
    this.collapsed = collapsed;
    this.dom.classList.toggle(COLLAPSED_CLASS, collapsed);
    this.toggle.textContent = collapsed ? '▸' : '▾';
  }
}
