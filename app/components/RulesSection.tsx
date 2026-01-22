export default function RulesSection() {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-medium text-white mb-3">
        Rules
      </summary>
      <table className="w-full mt-2 border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 text-white font-medium">
              Combination
            </th>
            <th className="text-right py-2 text-white font-medium">
              Points
            </th>
          </tr>
        </thead>
        <tbody className="text-gray-400">
          <tr className="border-b border-gray-800">
            <td className="py-2">1</td>
            <td className="text-right">100</td>
          </tr>
          <tr className="border-b border-gray-800">
            <td className="py-2">5</td>
            <td className="text-right">50</td>
          </tr>
          <tr className="border-b border-gray-800">
            <td className="py-2">111</td>
            <td className="text-right">1,000</td>
          </tr>
          <tr className="border-b border-gray-800">
            <td className="py-2">222/333/444/555/666</td>
            <td className="text-right">value × 100</td>
          </tr>
          <tr className="border-b border-gray-800">
            <td className="py-2">XXXX</td>
            <td className="text-right">double</td>
          </tr>
          <tr className="border-b border-gray-800">
            <td className="py-2">XXXXX</td>
            <td className="text-right">4×</td>
          </tr>
          <tr className="border-b border-gray-800">
            <td className="py-2">XXXXXX</td>
            <td className="text-right">8×</td>
          </tr>
          <tr className="border-b border-gray-800">
            <td className="py-2">1-2-3-4-5-6</td>
            <td className="text-right">1,500</td>
          </tr>
          <tr className="border-b border-gray-800">
            <td className="py-2">XXYYZZ</td>
            <td className="text-right">1,500</td>
          </tr>
          <tr className="border-b border-gray-800">
            <td className="py-2">Threshold</td>
            <td className="text-right">100 × 2^(turn-1)</td>
          </tr>
          <tr>
            <td className="py-2">Sparkle</td>
            <td className="text-right">Game Over</td>
          </tr>
        </tbody>
      </table>
    </details>
  );
}
