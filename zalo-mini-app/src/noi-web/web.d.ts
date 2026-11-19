// Mã web (../src) được Vite nạp qua bí danh "@/" — kiểu của nó do web tự kiểm (tsc web), Mini App chỉ cần biết là một thành phần React
declare module "@/components/PostListingForm" {
  const PostListingForm: import("react").ComponentType;
  export default PostListingForm;
}
