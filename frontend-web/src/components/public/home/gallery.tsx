import Image from "next/image";

const GALLERY = [
  {
    label: "Main dining room",
    src: "https://images.unsplash.com/photo-1667388968964-4aa652df0a9b?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    label: "Bar counter",
    src: "https://images.unsplash.com/photo-1571168136613-46401b03904e?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    label: "Terrace garden",
    src: "https://images.unsplash.com/photo-1624309796032-541571c98c3b?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    label: "Family room",
    src: "https://images.unsplash.com/photo-1597252395096-30cd2dcd628c?q=80&w=1497&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    label: "Table detail",
    src: "https://images.unsplash.com/photo-1608816042754-d69cb2271bea?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    label: "Daily special",
    src: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

export function HomeGallery() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <h2 className="font-brand text-3xl font-semibold text-[#2b2119] md:text-4xl">
        Space &amp; plates.
      </h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GALLERY.map((item, i) => (
          <div
            key={item.label}
            className="relative h-56 overflow-hidden rounded-2xl bg-[#f7ece4]"
          >
            <Image
              src={item.src}
              alt={item.label}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
