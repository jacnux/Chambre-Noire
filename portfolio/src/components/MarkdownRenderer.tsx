import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*':      ['style', 'className'],
    'img':    ['src', 'alt', 'width', 'height', 'style'],
    'a':      ['href', 'target', 'rel'],
    'iframe': [],
  },
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'div', 'span', 'section',
  ],
};

interface Props {
  children: string;
  className?: string;
}

const MarkdownRenderer: React.FC<Props> = ({ children, className }) => (
  <ReactMarkdown
    className={className}
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeRaw as any, [rehypeSanitize, schema] as any]}
  >
    {children}
  </ReactMarkdown>
);

export default MarkdownRenderer;
