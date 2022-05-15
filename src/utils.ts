
export enum ParseStatus {
  // 不是书签内容
  NotBookmark,
}

export interface IParseBookMark {
  title: string;
  type: string;
  url: string;
  createTime: number;
}

export const parseBookmark = (bookmark: string)  => {
  const doms = document.createElement('html');
  doms.innerHTML = bookmark.replaceAll(/<p>/ig, '');
  const dlTag = doms.getElementsByTagName('DL')[0];
  const isBookmark = doms.getElementsByTagName('title')[0]?.text === 'Bookmarks';
  if (!isBookmark || !dlTag) {
    return {
      error: true,
      status: ParseStatus.NotBookmark
    }
  }
  const isDlTag = (node) => node.nodeName === 'DL';
  const isH3Tag = (node) => node.nodeName === 'H3';
  const isBookmarkFolder = (node) => [...node.children].find(isH3Tag);

  const res: IParseBookMark[] = []
  const readContent = (node: Element, preTitle: string) => {
    // 一个书签分类
    if (!isDlTag(node)) {
      return;
    }
    const children = node.children || [];
    (children as any).forEach(node => {
      if (isBookmarkFolder(node)) {
        const [titleTag, dlTag] = node.children;
        const title = titleTag?.textContent || '';
        dlTag && readContent(dlTag, `${preTitle ? preTitle + '-' : preTitle}${title}`);
        return;
      }
      const [aTag] = node.children;
      if (!aTag) {
        return;
      }
      res.push({
        url: aTag.href,
        type: preTitle || '',
        title: aTag.textContent,
        createTime: aTag.getAttribute('add_date') * 1000
      })
    });
  }
  readContent(dlTag, '')
  return {
    data: res
  };
}