import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import BlogSidebar from '@theme/BlogSidebar';
import ContentWrapper from '@site/src/components/ContentWrapper';

import type {Props} from '@theme/BlogLayout';

export default function BlogLayout(props: Props): ReactNode {
  const {sidebar, toc, children, ...layoutProps} = props;
  const hasSidebar = sidebar && sidebar.items.length > 0;

  return (
    <Layout {...layoutProps}>
      <ContentWrapper style={{ maxWidth: '1600px', margin: '2rem auto' }}>
        <div className="container margin-vert--lg">
          <div className="row">
            <BlogSidebar sidebar={sidebar} />
            <main
              className={clsx('col', {
                'col--7': hasSidebar,
                'col--9 col--offset-1': !hasSidebar,
              })}>
              {children}
            </main>
            {toc && <div className="col col--2">{toc}</div>}
          </div>
        </div>
      </ContentWrapper>
    </Layout>
  );
}
