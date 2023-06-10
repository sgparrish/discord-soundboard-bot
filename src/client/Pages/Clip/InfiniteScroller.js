import React, { useRef, useEffect, useLayoutEffect } from "react";

const InfiniteScroller = ({
  loadingTop,
  loadingBottom,
  hasMoreTop,
  hasMoreBottom,
  loadMoreTop,
  loadMoreBottom,

  topMargin,
  bottomMargin,
  stickToBottom,
  startAtBottom,
  loaderComponent,

  children,
  ...rest
}) => {
  const wasLoadingTop = useRef(loadingTop);
  const wasLoadingBottom = useRef(loadingBottom);

  const onTop = useRef(false);
  const onBottom = useRef(false);

  const scrollRef = useRef();
  const onScroll = (evt) => {
    const scroll = scrollRef.current;
    onTop.current = scroll ? scroll.scrollTop <= topMargin : false;
    onBottom.current = scroll ? scroll.scrollTop + scroll.offsetHeight + bottomMargin >= scroll.scrollHeight : false;

    if (onTop.current && hasMoreTop && !loadingTop && typeof loadMoreTop === "function") loadMoreTop();
    if (onBottom.current && hasMoreBottom && !loadingBottom && typeof loadMoreBottom === "function") loadMoreBottom();
  };

  const justLoadedTop = wasLoadingTop.current && !loadingTop;
  const justLoadedBottom = wasLoadingBottom.current && !loadingBottom;

  const scrollFromBottom = scrollRef.current ? scrollRef.current.scrollHeight - scrollRef.current.scrollTop : 0;
  useLayoutEffect(() => {
    if (onBottom.current && !justLoadedBottom && stickToBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    } else if (justLoadedTop) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight - scrollFromBottom;
    }
  });

  // Update past refs
  useEffect(() => {
    wasLoadingTop.current = loadingTop;
    wasLoadingBottom.current = loadingBottom;
  });

  // load until we have a scrollbar
  useEffect(() => {
    const noScrollbar = scrollRef.current && scrollRef.current.offsetHeight === scrollRef.current.scrollHeight;
    if (noScrollbar && hasMoreTop && !loadingTop && typeof loadMoreTop === "function") loadMoreTop();
    if (noScrollbar && hasMoreBottom && !loadingBottom && typeof loadMoreBottom === "function") loadMoreBottom();
  });
  // #endregion

  // start at bottom
  useEffect(() => {
    if (startAtBottom) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [startAtBottom, scrollRef.current])

  return (
    <div ref={scrollRef} onScroll={onScroll} {...rest}>
      {loadingTop && loaderComponent}
      {children}
      {loadingBottom && loaderComponent}
    </div>
  );
};

export default InfiniteScroller;
