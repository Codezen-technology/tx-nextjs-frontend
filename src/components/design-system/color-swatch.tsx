interface SwatchProps {
  name: string;
  hex: string;
  rgb: string;
  darkRatio?: string;
  darkLevel?: "AA" | "AAA";
  whiteRatio?: string;
  whiteLevel?: "AA" | "AAA";
}

function Swatch({ name, hex, rgb, darkRatio, darkLevel, whiteRatio, whiteLevel }: SwatchProps) {
  return (
    <div className="relative h-14 w-[300px] shrink-0 overflow-hidden bg-white">
      {/* Colour block */}
      <div
        className="absolute top-0 left-0 h-14 w-40 rounded-xl border border-[#e9ebf8]"
        style={{ backgroundColor: hex }}
      />

      {/* Dark contrast badge */}
      {darkRatio && (
        <div className="absolute top-2 left-2 flex h-3.5 items-center gap-0.5 overflow-hidden rounded-full bg-white/80 px-1 py-0.5">
          <span className="size-2.5 shrink-0 rounded-[3px] border border-[#e9ebf8] bg-black" />
          <span className="text-[8px] leading-none font-normal text-black">{darkRatio}</span>
          {darkLevel && (
            <span className="text-[6px] leading-none font-normal text-black">{darkLevel}</span>
          )}
        </div>
      )}

      {/* White contrast badge */}
      {whiteRatio && (
        <div className="absolute top-[26px] left-2 flex h-3.5 items-center gap-0.5 overflow-hidden rounded-full bg-white/80 px-1 py-0.5">
          <span className="size-2.5 shrink-0 rounded-[3px] border border-[#e9ebf8] bg-white" />
          <span className="text-[8px] leading-none font-normal text-black">{whiteRatio}</span>
          {whiteLevel && (
            <span className="text-[6px] leading-none font-normal text-black">{whiteLevel}</span>
          )}
        </div>
      )}

      {/* Label */}
      <p className="absolute top-0.5 left-44 text-sm leading-5 font-medium text-black">{name}</p>
      <p className="absolute top-[22px] left-44 text-[10px] leading-4 font-normal text-[#8e98a8]">
        {hex}
      </p>
      <p className="absolute top-[38px] left-44 text-[10px] leading-4 font-normal text-[#8e98a8]">
        {rgb}
      </p>
    </div>
  );
}

// ─── Primary ──────────────────────────────────────────────────────────────────

export function PrimarySwatches() {
  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-xl bg-white p-8">
      <p className="text-2xl leading-10 font-medium text-black">Primary</p>
      <div className="flex flex-col gap-4">
        <Swatch
          name="primary-50"
          hex="#e6f8fe"
          rgb="rgb(230, 248, 254)"
          darkRatio="19.22 AAA"
          darkLevel="AAA"
          whiteRatio="1.09"
        />
        <Swatch
          name="primary-100"
          hex="#b0eafa"
          rgb="rgb(176, 234, 250)"
          darkRatio="16.00 AAA"
          darkLevel="AAA"
          whiteRatio="1.31"
        />
        <Swatch
          name="primary-200"
          hex="#8ae0f8"
          rgb="rgb(138, 224, 248)"
          darkRatio="14.10 AAA"
          darkLevel="AAA"
          whiteRatio="1.49"
        />
        <Swatch
          name="primary-300"
          hex="#54d1f5"
          rgb="rgb(84, 209, 245)"
          darkRatio="11.82 AAA"
          darkLevel="AAA"
          whiteRatio="1.78"
        />
        <Swatch
          name="primary-400"
          hex="#33c9f3"
          rgb="rgb(51, 201, 243)"
          darkRatio="10.79 AAA"
          darkLevel="AAA"
          whiteRatio="1.95"
        />
        <Swatch
          name="primary-500"
          hex="#00bbf0"
          rgb="rgb(0, 187, 240)"
          darkRatio="9.37 AAA"
          darkLevel="AAA"
          whiteRatio="2.24"
        />
        <Swatch
          name="primary-600"
          hex="#00aada"
          rgb="rgb(0, 170, 218)"
          darkRatio="7.76 AAA"
          darkLevel="AAA"
          whiteRatio="2.71"
        />
        <Swatch
          name="primary-700"
          hex="#0085aa"
          rgb="rgb(0, 133, 170)"
          darkRatio="4.94 AAA"
          darkLevel="AA"
          whiteRatio="4.25 AA"
          whiteLevel="AA"
        />
        <Swatch
          name="primary-800"
          hex="#006784"
          rgb="rgb(0, 103, 132)"
          darkRatio="3.27 AA"
          whiteRatio="6.42 AAA"
          whiteLevel="AA"
        />
        <Swatch
          name="primary-900"
          hex="#004f65"
          rgb="rgb(0, 79, 101)"
          darkRatio="2.31"
          whiteRatio="9.11 AAA"
          whiteLevel="AAA"
        />
      </div>
    </div>
  );
}

// ─── Secondary ────────────────────────────────────────────────────────────────

export function SecondarySwatches() {
  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-xl bg-white p-8">
      <p className="text-2xl leading-10 font-medium text-black">Secondary</p>
      <div className="flex flex-col gap-4">
        <Swatch
          name="secondary-50"
          hex="#f5f1e9"
          rgb="rgb(245, 241, 233)"
          darkRatio="18.64 AAA"
          darkLevel="AAA"
          whiteRatio="1.13"
        />
        <Swatch
          name="secondary-100"
          hex="#e1d2ba"
          rgb="rgb(225, 210, 186)"
          darkRatio="14.13 AAA"
          darkLevel="AAA"
          whiteRatio="1.49"
        />
        <Swatch
          name="secondary-200"
          hex="#d2bd99"
          rgb="rgb(210, 189, 153)"
          darkRatio="11.48 AAA"
          darkLevel="AAA"
          whiteRatio="1.83"
        />
        <Swatch
          name="secondary-300"
          hex="#be9f6a"
          rgb="rgb(190, 159, 106)"
          darkRatio="8.36 AAA"
          darkLevel="AAA"
          whiteRatio="2.51"
        />
        <Swatch
          name="secondary-400"
          hex="#b18c4d"
          rgb="rgb(177, 140, 77)"
          darkRatio="6.73 AAA"
          darkLevel="AA"
          whiteRatio="3.12 AA"
          whiteLevel="AA"
        />
        <Swatch
          name="secondary-500"
          hex="#9e6f21"
          rgb="rgb(158, 111, 33)"
          darkRatio="4.75 AAA"
          darkLevel="AA"
          whiteRatio="4.42 AA"
          whiteLevel="AA"
        />
        <Swatch
          name="secondary-600"
          hex="#90651e"
          rgb="rgb(144, 101, 30)"
          darkRatio="4.07 AA"
          whiteRatio="5.16 AAA"
          whiteLevel="AA"
        />
        <Swatch
          name="secondary-700"
          hex="#704f17"
          rgb="rgb(112, 79, 23)"
          darkRatio="2.82"
          whiteRatio="7.45 AAA"
          whiteLevel="AAA"
        />
        <Swatch
          name="secondary-800"
          hex="#573d12"
          rgb="rgb(87, 61, 18)"
          darkRatio="2.08"
          whiteRatio="10.09 AAA"
          whiteLevel="AAA"
        />
        <Swatch
          name="secondary-900"
          hex="#422f0e"
          rgb="rgb(66, 47, 14)"
          darkRatio="1.64"
          whiteRatio="12.77 AAA"
          whiteLevel="AAA"
        />
      </div>
    </div>
  );
}

// ─── Neutral ──────────────────────────────────────────────────────────────────

export function NeutralSwatches() {
  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-xl bg-white p-8">
      <p className="text-2xl leading-10 font-medium text-black">Neutral</p>
      <div className="flex flex-col gap-4">
        <Swatch
          name="N0"
          hex="#ffffff"
          rgb="rgb(255, 255, 255)"
          darkRatio="21.00 AAA"
          darkLevel="AAA"
          whiteRatio="1.00"
        />
        <Swatch
          name="N10"
          hex="#fafbfb"
          rgb="rgb(250, 251, 251)"
          darkRatio="20.26 AAA"
          darkLevel="AAA"
          whiteRatio="1.04"
        />
        <Swatch
          name="N20"
          hex="#f5f6f8"
          rgb="rgb(245, 246, 248)"
          darkRatio="19.42 AAA"
          darkLevel="AAA"
          whiteRatio="1.08"
        />
        <Swatch
          name="N30"
          hex="#ebedf1"
          rgb="rgb(235, 237, 241)"
          darkRatio="17.92 AAA"
          darkLevel="AAA"
          whiteRatio="1.17"
        />
        <Swatch
          name="N40"
          hex="#dee2e7"
          rgb="rgb(222, 226, 231)"
          darkRatio="16.14 AAA"
          darkLevel="AAA"
          whiteRatio="1.30"
        />
        <Swatch
          name="N50"
          hex="#bfc7d2"
          rgb="rgb(191, 199, 210)"
          darkRatio="12.32 AAA"
          darkLevel="AAA"
          whiteRatio="1.71"
        />
        <Swatch
          name="N60"
          hex="#b0bac7"
          rgb="rgb(176, 186, 199)"
          darkRatio="10.69 AAA"
          darkLevel="AAA"
          whiteRatio="1.96"
        />
        <Swatch
          name="N70"
          hex="#a3afbe"
          rgb="rgb(163, 175, 190)"
          darkRatio="9.43 AAA"
          darkLevel="AAA"
          whiteRatio="2.23"
        />
        <Swatch
          name="N80"
          hex="#94a1b3"
          rgb="rgb(148, 161, 179)"
          darkRatio="8.01 AAA"
          darkLevel="AAA"
          whiteRatio="2.62"
        />
        <Swatch
          name="N90"
          hex="#8594a8"
          rgb="rgb(133, 148, 168)"
          darkRatio="6.80 AAA"
          darkLevel="AA"
          whiteRatio="3.09"
        />
        <Swatch
          name="N100"
          hex="#75879d"
          rgb="rgb(117, 135, 157)"
          darkRatio="5.71 AAA"
          darkLevel="AA"
          whiteRatio="3.68 AA"
          whiteLevel="AA"
        />
        <Swatch
          name="N200"
          hex="#667992"
          rgb="rgb(102, 121, 146)"
          darkRatio="4.71 AAA"
          darkLevel="AA"
          whiteRatio="4.45 AA"
          whiteLevel="AA"
        />
        <Swatch
          name="N300"
          hex="#576c88"
          rgb="rgb(87, 108, 136)"
          darkRatio="3.91 AA"
          whiteRatio="5.38 AAA"
          whiteLevel="AA"
        />
        <Swatch
          name="N400"
          hex="#4a617e"
          rgb="rgb(74, 97, 126)"
          darkRatio="3.30 AA"
          whiteRatio="6.36 AAA"
          whiteLevel="AA"
        />
        <Swatch
          name="N500"
          hex="#3b5374"
          rgb="rgb(59, 83, 116)"
          darkRatio="2.68"
          whiteRatio="7.85 AAA"
          whiteLevel="AAA"
        />
        <Swatch
          name="N600"
          hex="#2e486b"
          rgb="rgb(46, 72, 107)"
          darkRatio="2.26"
          whiteRatio="9.31 AAA"
          whiteLevel="AAA"
        />
        <Swatch
          name="N700"
          hex="#1c395e"
          rgb="rgb(28, 57, 94)"
          darkRatio="1.80"
          whiteRatio="11.69 AAA"
          whiteLevel="AAA"
        />
        <Swatch
          name="N800"
          hex="#0d2b53"
          rgb="rgb(13, 43, 83)"
          darkRatio="1.49"
          whiteRatio="14.12 AAA"
          whiteLevel="AAA"
        />
        <Swatch
          name="N900"
          hex="#00204a"
          rgb="rgb(0, 32, 74)"
          darkRatio="1.31"
          whiteRatio="16.09 AAA"
          whiteLevel="AAA"
        />
      </div>
    </div>
  );
}
