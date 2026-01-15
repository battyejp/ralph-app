import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));
    expect(result.current).toBe('test');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Update the value
    rerender({ value: 'updated', delay: 500 });

    // Value should still be initial
    expect(result.current).toBe('initial');

    // Fast-forward time by 500ms
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now the value should be updated
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 500 } }
    );

    // Change value multiple times rapidly
    rerender({ value: 'second', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: 'third', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: 'fourth', delay: 500 });

    // Value should still be initial
    expect(result.current).toBe('first');

    // Fast-forward to complete the last timeout
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Only the last value should be set
    expect(result.current).toBe('fourth');
  });

  it('should work with different delay times', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'test', delay: 1000 } }
    );

    rerender({ value: 'updated', delay: 1000 });

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('test');

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('updated');
  });

  it('should work with different value types', () => {
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 123, delay: 500 } }
    );

    numberRerender({ value: 456, delay: 500 });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(numberResult.current).toBe(456);

    const { result: boolResult, rerender: boolRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: true, delay: 500 } }
    );

    boolRerender({ value: false, delay: 500 });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(boolResult.current).toBe(false);

    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: { key: 'value1' }, delay: 500 } }
    );

    const newObj = { key: 'value2' };
    objectRerender({ value: newObj, delay: 500 });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(objectResult.current).toBe(newObj);
  });

  it('should cleanup timeout on unmount', () => {
    const { unmount } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'test', delay: 500 } }
    );

    unmount();

    // Should not throw error when advancing timers after unmount
    expect(() => {
      act(() => {
        jest.advanceTimersByTime(500);
      });
    }).not.toThrow();
  });
});
