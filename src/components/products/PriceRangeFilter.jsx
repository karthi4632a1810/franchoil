import { useEffect, useMemo, useState } from "react";

const MIN_GAP = 50;

export default function PriceRangeFilter({ min = 0, max = 1000, value, onChange }) {
  const ceiling = Math.max(max, MIN_GAP * 2);
  const [minVal, setMinVal] = useState(value?.min ?? min);
  const [maxVal, setMaxVal] = useState(value?.max ?? ceiling);

  useEffect(() => {
    setMinVal(value?.min ?? min);
    setMaxVal(value?.max ?? ceiling);
  }, [value?.min, value?.max, min, ceiling]);

  const trackStyle = useMemo(() => {
    const p1 = (minVal / ceiling) * 100;
    const p2 = (maxVal / ceiling) * 100;
    return {
      background: `linear-gradient(to right, #e5e7eb ${p1}%, var(--p-c) ${p1}%, var(--p-c) ${p2}%, #e5e7eb ${p2}%)`,
    };
  }, [minVal, maxVal, ceiling]);

  const updateMin = (next) => {
    let v = Math.min(next, maxVal - MIN_GAP);
    v = Math.max(min, v);
    setMinVal(v);
  };

  const updateMax = (next) => {
    let v = Math.max(next, minVal + MIN_GAP);
    v = Math.min(ceiling, v);
    setMaxVal(v);
  };

  const apply = () => onChange?.({ min: minVal, max: maxVal });

  return (
    <div className="catalog-price-filter">
      <div className="slider-container">
        <div className="slider-track" style={trackStyle} />
        <input
          type="range"
          min={min}
          max={ceiling}
          value={minVal}
          onChange={(e) => updateMin(parseInt(e.target.value, 10))}
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={min}
          max={ceiling}
          value={maxVal}
          onChange={(e) => updateMax(parseInt(e.target.value, 10))}
          aria-label="Maximum price"
        />
      </div>
      <div className="price-inputs">
        <span className="rangePrice font-sans tabular-nums">₹{minVal}</span>
        <span className="range-sep">to</span>
        <span className="rangePrice font-sans tabular-nums">₹{maxVal}</span>
      </div>
      <button type="button" className="catalog-filter-apply" onClick={apply}>
        Filter
      </button>
    </div>
  );
}
