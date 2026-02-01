# Whizz

A minimal, type-safe web component framework inspired by [Tonic](https://github.com/socketsupply/tonic).

Single file, single class, fully typed with TypeScript, zero runtime dependencies.

## Features

- **Fully typed** - Complete TypeScript support with generics for props and state
- **Minimal** - Single file, single class implementation
- **Zero dependencies** - Built on native Web Components
- **Async support** - Render methods can be sync, async, or async generators
- **Simple API** - Clean, intuitive API similar to Tonic
- **Lifecycle hooks** - Full lifecycle control (willConnect, connected, disconnected, etc.)

## Installation

```bash
pnpm install
pnpm run build
```

## Quick Start

```typescript
import Component from './framework.js';

class MyGreeting extends Component<{ name: string }> {
  render() {
    return this.html`
      <h1>Hello, ${this.props.name}!</h1>
    `;
  }
}

Component.add(MyGreeting, 'my-greeting');
```

```html
<my-greeting name="World"></my-greeting>
```

## Examples

### Stateful Component

```typescript
interface CounterState {
  count: number;
}

class Counter extends Component<{}, CounterState> {
  constructor() {
    super();
    this.state = { count: 0 };
  }

  connected() {
    this.addEventListener('click', () => {
      this.state.count++;
      this.reRender({});
    });
  }

  render() {
    return this.html`
      <button>Count: ${this.state.count}</button>
    `;
  }
}
```

### Async Component with Loading State

```typescript
class DataFetcher extends Component<{ url: string }> {
  async *render() {
    yield this.html`<div>Loading...</div>`;

    const response = await fetch(this.props.url);
    const data = await response.json();

    return this.html`<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }
}
```

### Component with Styles

```typescript
class StyledButton extends Component {
  render() {
    return this.html`<button>Click me</button>`;
  }

  stylesheet() {
    return `
      button {
        padding: 1rem 2rem;
        background: blue;
        color: white;
        border: none;
        border-radius: 4px;
      }
    `;
  }
}
```

## API Reference

### Component Class

#### Generic Types

```typescript
class MyComponent extends Component<Props, State>
```

- `Props` - Type for component properties (from attributes)
- `State` - Type for internal component state

#### Instance Properties

- `props` - Component properties extracted from attributes
- `state` - Component state object
- `elements` - Array of original child elements
- `nodes` - Array of original child nodes

#### Instance Methods

- `html` - Tagged template for creating HTML
- `reRender(props)` - Update component with new props
- `dispatch(eventName, detail?)` - Dispatch custom event

#### Static Methods

- `Component.add(Class, tagName?)` - Register component as custom element
- `Component.escape(str)` - Escape HTML characters
- `Component.unsafeRawString(str)` - Create unescaped HTML string
- `Component.match(node, selector)` - Check if node matches selector

#### Lifecycle Hooks

- `willConnect()` - Called before component connects to DOM
- `willRender()` - Called before each render
- `connected()` - Called after component connects to DOM
- `disconnected()` - Called when component is removed from DOM
- `updated(oldProps)` - Called after reRender (not initial render)

#### Required Methods

- `render()` - Return HTML string (can be sync, async, or async generator)

#### Optional Methods

- `stylesheet()` - Return CSS for component (added as style tag)
- `static stylesheet()` - Return CSS for document head (added once)
- `styles()` - Return object of inline styles

## Running the Demo

```bash
pnpm install
pnpm run build
# Open demo.html in your browser
```

## Comparison with Tonic

Whizz is heavily inspired by Tonic but adds:

- Full TypeScript support with proper typing
- Generic types for props and state
- Stricter type safety throughout
- Better IDE autocomplete and intellisense

Like Tonic, it's:

- Single file, minimal footprint
- Zero dependencies
- Based on Web Components
- Simple, intuitive API

## License

ISC
