export interface ContentSection {
  heading: string;
  content: string;
}

export interface GeneratedData {
  title: string;
  introduction: string;
  sections: ContentSection[];
  conclusion: string;
  imagePrompts: string[];
}
