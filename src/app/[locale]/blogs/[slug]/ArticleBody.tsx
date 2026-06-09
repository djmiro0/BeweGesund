import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "../Blogs.module.css";

interface ArticleBodyProps {
  body: string;
}

export default function ArticleBody({ body }: ArticleBodyProps) {
  return (
    <div className={styles.articleBody}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          a: ({ href, children }) => {
            const isExternal = href?.startsWith("http");

            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer" : undefined}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
