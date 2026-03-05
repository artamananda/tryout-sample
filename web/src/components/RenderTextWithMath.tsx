import parse from 'html-react-parser';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Render text that may include LaTeX math between $...$ or $$...$$ using KaTeX.
const renderTextWithMath = (text: string) => {
  if (!text) return null;
  const parts: any[] = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$(?!\$)[^\$\n]+\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const idx = match.index;
    if (idx > lastIndex) {
      const plain = text.slice(lastIndex, idx);
      parts.push(parse(plain));
    }

    const mathRaw = match[0];
    const isBlock = mathRaw.startsWith('$$');
    const content = isBlock ? mathRaw.slice(2, -2) : mathRaw.slice(1, -1);
    try {
      const rendered = katex.renderToString(content, {
        throwOnError: false,
        displayMode: isBlock
      });
      parts.push(
        // eslint-disable-next-line react/no-danger
        <span
          key={`${idx}-${lastIndex}`}
          dangerouslySetInnerHTML={{ __html: rendered }}
          style={{ margin: isBlock ? '8px 0' : '0 2px' }}
        />
      );
    } catch (err) {
      parts.push(mathRaw);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(parse(text.slice(lastIndex)));
  }

  return parts;
};

export default renderTextWithMath;
