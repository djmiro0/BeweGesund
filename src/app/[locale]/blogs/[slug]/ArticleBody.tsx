import Image from "next/image";
import {
  documentToReactComponents,
  type Options,
} from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES, type Document } from "@contentful/rich-text-types";
import styles from "../Blogs.module.css";

interface ArticleBodyProps {
  body: Document;
}

const richTextOptions: Options = {
  renderNode: {
    [BLOCKS.HEADING_1]: (_node, children) => <h2>{children}</h2>,
    [INLINES.HYPERLINK]: (node, children) => {
      const href = String(node.data.uri ?? "");
      const isExternal = /^https?:\/\//.test(href);

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
    [BLOCKS.EMBEDDED_ASSET]: (node) => {
      const fields = node.data.target?.fields;
      const url = fields?.file?.url;

      if (!url) return null;

      const width = fields.file.details?.image?.width ?? 1200;
      const height = fields.file.details?.image?.height ?? 675;

      return (
        <figure className={styles.embeddedImage}>
          <Image
            src={url.startsWith("//") ? `https:${url}` : url}
            alt={fields.description ?? fields.title ?? ""}
            width={width}
            height={height}
            sizes="(min-width: 768px) 860px, calc(100vw - 1.7rem)"
          />
        </figure>
      );
    },
  },
};

export default function ArticleBody({ body }: ArticleBodyProps) {
  return (
    <div className={styles.articleBody}>
      {documentToReactComponents(body, richTextOptions)}
    </div>
  );
}
