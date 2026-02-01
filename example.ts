import Component from './framework.js';

// Example 1: Simple synchronous component
class MyGreeting extends Component<{ name: string }> {
  render() {
    return this.html`
      <div>
        <h1>Hello, ${this.props.name || 'World'}!</h1>
      </div>
    `;
  }

  stylesheet() {
    return `
      h1 {
        color: #333;
        font-family: sans-serif;
      }
    `;
  }
}

// Example 2: Async component with loading state
class DataFetcher extends Component<{ url: string }> {
  async *render() {
    // Show loading state first
    yield this.html`<div class="loading">Loading...</div>`;

    // Fetch data
    try {
      const response = await fetch(this.props.url);
      const data = await response.json();

      // Show final result
      return this.html`
        <div class="result">
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>
      `;
    } catch (error) {
      return this.html`
        <div class="error">
          Error: ${error instanceof Error ? error.message : 'Unknown error'}
        </div>
      `;
    }
  }

  static stylesheet() {
    return `
      .loading {
        color: #666;
        font-style: italic;
      }
      .error {
        color: red;
      }
      .result {
        background: #f5f5f5;
        padding: 1rem;
        border-radius: 4px;
      }
    `;
  }
}

// Example 3: Stateful counter component
interface CounterState {
  count: number;
}

class Counter extends Component<{}, CounterState> {
  constructor() {
    super();
    this.state = { count: 0 };
  }

  connected() {
    this.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (Component.match(target, '.increment')) {
        this.state.count++;
        this.reRender({});
      } else if (Component.match(target, '.decrement')) {
        this.state.count--;
        this.reRender({});
      }
    });
  }

  render() {
    return this.html`
      <div class="counter">
        <button class="decrement">-</button>
        <span class="count">${this.state.count}</span>
        <button class="increment">+</button>
      </div>
    `;
  }

  stylesheet() {
    return `
      .counter {
        display: flex;
        gap: 1rem;
        align-items: center;
        padding: 1rem;
      }
      button {
        padding: 0.5rem 1rem;
        font-size: 1.2rem;
        cursor: pointer;
      }
      .count {
        font-size: 1.5rem;
        min-width: 3ch;
        text-align: center;
      }
    `;
  }

  updated(_oldProps: {}) {
    // Dispatch event when counter changes
    this.dispatch('counter-changed', {
      count: this.state.count
    });
  }
}

// Example 4: Component with lifecycle hooks
class LifecycleDemo extends Component {
  willConnect() {
    console.log('About to connect to DOM');
  }

  willRender() {
    console.log('About to render');
  }

  connected() {
    console.log('Connected to DOM');
  }

  disconnected() {
    console.log('Disconnected from DOM');
  }

  render() {
    return this.html`
      <div>Check the console for lifecycle events!</div>
    `;
  }
}

// Register all components
Component.add(MyGreeting, 'my-greeting');
Component.add(DataFetcher, 'data-fetcher');
Component.add(Counter);  // Will auto-generate 'counter' tag name
Component.add(LifecycleDemo, 'lifecycle-demo');
