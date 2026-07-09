import { Node as ProseMirrorNode } from 'prosemirror-model';
import { NodeView, ViewMutationRecord } from 'prosemirror-view';

const COLLAPSED_CLASS = 'prompt-section-collapsed';

/**
 * Renders a section with a collapse toggle. Collapse is view-only state —
 * it never enters the document JSON, which stays purely semantic.
 */
export class SectionNodeView implements NodeView {
  readonly dom: HTMLElement;
  readonly contentDOM: HTMLElement;
  private readonly toggle: HTMLButtonElement;
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

    this.contentDOM = document.createElement('div');
    this.contentDOM.className = 'prompt-section-content';

    this.dom.append(this.toggle, this.contentDOM);
  }

  update(node: ProseMirrorNode): boolean {
    if (node.type.name !== 'section') return false;
    this.dom.dataset.sectionId = node.attrs.id;
    return true;
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
