"use client";
import axios from "axios";
import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const [posts, setPosts] = useState([]);

  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");

  const getPosts = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/posts");
      if (!data.success) return toast.error(data.message);
      setPosts(data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a file to upload");
    if (!caption) return toast.error("Please enter a caption");
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("caption", caption);
      const { data } = await axios.post(
        "http://localhost:5000/api/posts/multer",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!data.success) return toast.error(data.message);
      setCaption("");
      setFile(null);
      getPosts();
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    getPosts();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const { data } = await axios.delete(
        `http://localhost:5000/api/posts/${id}`
      );
      if (!data.success) return toast.error(data.message);
      toast.success(data.message);
      getPosts();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <main className="container mx-auto py-10 w-screen min-h-screen">
      <div className="center flex-col">
        <h1 className="text-center text-4xl">AWS S3 Example Application</h1>
        <p className="text-center text-lg my-2">
          This is an example application that demonstrates how to use AWS S3 to
          store and retrieve files.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 center flex-col max-w-96 mx-auto w-full"
        >
          <label
            htmlFor="file"
            className="flex items-center justify-center size-40 bg-neutral-800 shadow-sm mb-10 rounded-full mx-auto"
          >
            {file ? (
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="rounded-full size-full object-cover"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-14 w-14 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            )}
          </label>

          <input
            type="file"
            id="file"
            className="hidden"
            accept="image/*"
            onChange={(e: any) => setFile(e.target.files[0])}
          />

          <input
            type="text"
            placeholder="Enter Caption"
            className="border border-neutral-800 py-1.5 px-4 block rounded-md w-full outline-none mb-3 text-black"
            value={caption}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setCaption(e.target.value)
            }
          />

          <button className="text-white bg-purple-500 text-center py-2 px-8 rounded-md  w-full">
            Post
          </button>
        </form>
      </div>

      <div className="grid lg:grid-cols-4 md:grid-cols-3 grid-cols-1 gap-5 mt-10">
        {posts &&
          posts.map((post: any) => (
            <div
              key={post._id}
              className="relative bg-neutral-800 rounded-md p-4"
            >
              <Image
                src={post.imageUrl}
                alt={post.caption}
                width={500}
                height={500}
                className="rounded-md object-cover w-full h-52"
              />
              <p className="text-white text-lg mt-2">{post.caption}</p>
              <button
                onClick={() => handleDelete(post._id)}
                className="text-white bg-red-500 absolute -top-2 -right-2 center size-8 rounded-full text-2xl"
              >
                &times;
              </button>
            </div>
          ))}
      </div>
    </main>
  );
}
