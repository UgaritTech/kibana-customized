<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [kibana-plugin-core-server](./kibana-plugin-core-server.md) &gt; [EventLoopDelaysMonitor](./kibana-plugin-core-server.eventloopdelaysmonitor.md)

## EventLoopDelaysMonitor class

<b>Signature:</b>

```typescript
export declare class EventLoopDelaysMonitor 
```

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)()](./kibana-plugin-core-server.eventloopdelaysmonitor._constructor_.md) |  | Creating a new instance from EventLoopDelaysMonitor will automatically start tracking event loop delays. |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [collect()](./kibana-plugin-core-server.eventloopdelaysmonitor.collect.md) |  | Collect gathers event loop delays metrics from nodejs perf\_hooks.monitorEventLoopDelay the histogram calculations start from the last time <code>reset</code> was called or this EventLoopDelaysMonitor instance was created.<!-- -->Returns metrics in milliseconds. |
|  [reset()](./kibana-plugin-core-server.eventloopdelaysmonitor.reset.md) |  | Resets the collected histogram data. |
|  [stop()](./kibana-plugin-core-server.eventloopdelaysmonitor.stop.md) |  | Disables updating the interval timer for collecting new data points. |

