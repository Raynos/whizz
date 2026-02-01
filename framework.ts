/**
 * A minimal, type-safe web component framework inspired by Tonic
 * Single file, single class, zero dependencies
 */

type RenderResult = string | void | null;
type AsyncRenderResult = Promise<RenderResult>;
type GeneratorRenderResult = AsyncGenerator<string, string, void>;
type RenderReturnType = RenderResult | AsyncRenderResult | GeneratorRenderResult;

export interface ComponentProps {
  [key: string]: any;
}

export interface ComponentState {
  [key: string]: any;
}

export interface CustomEventDetail {
  [key: string]: any;
}

/**
 * Base class for creating web components
 */
export abstract class Component<
  Props extends ComponentProps = ComponentProps,
  State extends ComponentState = ComponentState
> extends HTMLElement {
  props: Props = {} as Props;
  state: State = {} as State;
  elements: Element[] = [];
  nodes: Node[] = [];

  private _rendering = false;
  private _connected = false;

  constructor() {
    super();

    // Capture original children before they're replaced
    this.elements = Array.from(this.children);
    this.nodes = Array.from(this.childNodes);
  }

  /**
   * Register a component class as a custom element
   */
  static add(
    ComponentClass: CustomElementConstructor,
    tagName?: string
  ): void {
    const name = tagName || this.toKebabCase(ComponentClass.name);

    if (!customElements.get(name)) {
      customElements.define(name, ComponentClass);
    }
  }

  /**
   * Convert PascalCase to kebab-case
   */
  private static toKebabCase(str: string): string {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
      .toLowerCase();
  }

  /**
   * Escape HTML characters from a string
   */
  static escape(str: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
    };
    return str.replace(/[&<>"'/]/g, (char) => map[char]);
  }

  /**
   * Create a raw string that won't be escaped (use with caution!)
   */
  static unsafeRawString(str: string): { __html: string } {
    return { __html: str };
  }

  /**
   * Match a node against a selector
   */
  static match(node: Node, selector: string): boolean {
    if (!(node instanceof Element)) return false;
    return node.matches(selector);
  }

  /**
   * Tagged template for creating HTML
   */
  html(strings: TemplateStringsArray, ...values: any[]): string {
    let result = '';

    for (let i = 0; i < strings.length; i++) {
      result += strings[i];

      if (i < values.length) {
        const value = values[i];

        // Handle raw strings
        if (value && typeof value === 'object' && '__html' in value) {
          result += value.__html;
        }
        // Handle arrays (for lists)
        else if (Array.isArray(value)) {
          result += value.join('');
        }
        // Handle null/undefined
        else if (value == null) {
          result += '';
        }
        // Handle primitives
        else {
          result += Component.escape(String(value));
        }
      }
    }

    return result;
  }

  /**
   * Re-render the component with new props
   */
  async reRender(
    propsOrFn: Partial<Props> | ((currentProps: Props) => Partial<Props>)
  ): Promise<void> {
    if (typeof propsOrFn === 'function') {
      this.props = { ...this.props, ...propsOrFn(this.props) };
    } else {
      this.props = { ...this.props, ...propsOrFn };
    }

    const oldProps = { ...this.props };
    await this._doRender();

    if (this.updated) {
      this.updated(oldProps);
    }
  }

  /**
   * Dispatch a custom event from this component
   */
  dispatch(eventName: string, detail?: CustomEventDetail): boolean {
    const event = new CustomEvent(eventName, {
      bubbles: true,
      composed: true,
      detail,
    });
    return this.dispatchEvent(event);
  }

  // Lifecycle methods (to be implemented by subclasses)

  /**
   * Called before the component is connected to the DOM
   */
  willConnect?(): void;

  /**
   * Called before render
   */
  willRender?(): void;

  /**
   * Called after the component is connected to the DOM
   */
  connected?(): void | Promise<void>;

  /**
   * Called when the component is disconnected from the DOM
   */
  disconnected?(): void;

  /**
   * Called after reRender (not on initial render)
   */
  updated?(oldProps: Props): void;

  /**
   * Required: render method that returns HTML
   */
  abstract render(): RenderReturnType;

  /**
   * Optional: return CSS for a style tag
   */
  stylesheet?(): string;

  /**
   * Optional: return CSS to be added to document head (static)
   */
  static stylesheet?(): string;

  /**
   * Optional: return inline styles object
   */
  styles?(): Record<string, string>;

  // Web Component lifecycle callbacks

  async connectedCallback(): Promise<void> {
    if (this._connected) return;
    this._connected = true;

    // Extract props from attributes
    this._extractProps();

    // Call willConnect hook
    if (this.willConnect) {
      this.willConnect();
    }

    // Add static stylesheet to document head
    const constructor = this.constructor as typeof Component;
    if (constructor.stylesheet) {
      this._addStaticStylesheet(constructor.stylesheet());
    }

    // Initial render
    await this._doRender();

    // Call connected hook
    if (this.connected) {
      await this.connected();
    }
  }

  disconnectedCallback(): void {
    if (this.disconnected) {
      this.disconnected();
    }
    this._connected = false;
  }

  /**
   * Extract props from attributes
   */
  private _extractProps(): void {
    for (const attr of Array.from(this.attributes)) {
      const key = this._toCamelCase(attr.name);

      // Try to parse as JSON, fallback to string
      try {
        this.props[key as keyof Props] = JSON.parse(attr.value);
      } catch {
        this.props[key as keyof Props] = attr.value as any;
      }
    }
  }

  /**
   * Convert kebab-case to camelCase
   */
  private _toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Perform the render
   */
  private async _doRender(): Promise<void> {
    if (this._rendering) return;
    this._rendering = true;

    try {
      // Call willRender hook
      if (this.willRender) {
        this.willRender();
      }

      const result = this.render();

      // Handle async generator (for loading states)
      if (result && typeof result === 'object' && Symbol.asyncIterator in result) {
        for await (const chunk of result as AsyncGenerator<string, string, void>) {
          this._updateDOM(chunk);
        }
      }
      // Handle promise
      else if (result instanceof Promise) {
        const html = await result;
        if (html) this._updateDOM(html);
      }
      // Handle sync
      else if (result) {
        this._updateDOM(result);
      }
    } finally {
      this._rendering = false;
    }
  }

  /**
   * Update the DOM with rendered HTML
   */
  private _updateDOM(html: string): void {
    this.innerHTML = html;

    // Add component stylesheet
    if (this.stylesheet) {
      const style = document.createElement('style');
      style.textContent = this.stylesheet();
      this.prepend(style);
    }

    // Apply inline styles
    if (this.styles) {
      const styles = this.styles();
      for (const [key, value] of Object.entries(styles)) {
        this.style.setProperty(key, value);
      }
    }
  }

  /**
   * Add static stylesheet to document head
   */
  private _addStaticStylesheet(css: string): void {
    const id = `style-${this.constructor.name}`;
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = css;
      document.head.appendChild(style);
    }
  }
}

export default Component;
