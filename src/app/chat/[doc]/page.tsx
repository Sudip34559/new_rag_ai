import Chat from "@/components/chat";
import GitHubAnalyzer from "@/components/gitHubAnalyzer";
import WebsiteViewer from "@/components/newWebpreviewer";
import PdfViewer from "@/components/pdfViewer";
import ResizableSplitView from "@/components/resizable-split-view";
// import WebsiteViewer from "@/components/webPreviewer";
import YouTubeViewer from "@/components/youtubeViewer";

export default async function Page({ params }: { params: { doc: string } }) {
  const { doc } = await params;
  const pages: {
    [key: string]: { component: React.ReactNode; name: string };
  } = {
    "pdf-doc": {
      component: <PdfViewer />,
      name: "pdf-doc",
    },
    "web-page": {
      component: <WebsiteViewer />,
      name: "web-doc",
    },
    "youtube-video": {
      component: <YouTubeViewer />,
      name: "youtube-vedio-trans",
    },
    "github-repo": {
      component: <GitHubAnalyzer />,
      name: "git-repo",
    },
  };

  // console.log(doc);

  return (
    <ResizableSplitView
      leftPlane={pages[doc || "pdf-doc"].component}
      rightPlane={<Chat type={pages[doc || "pdf-doc"].name} />}
    />
  );
}
