type Artist = {
  name: string,
  id: string,
  img: string
}

interface Option {
  name: string;
  img: string;
}

interface ArtistData extends Option {
  previews: string[];
}

type Question = {
  text: string;
  options: Option[];
  correctAnswer: string;
  preview: string[];
}
