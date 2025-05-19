import { put } from "@vercel/blob"
import { nanoid } from "nanoid"

export async function uploadImage(file: File) {
  try {
    const filename = `${nanoid()}-${file.name}`
    const { url } = await put(filename, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    return url
  } catch (error) {
    console.error("Error uploading image:", error)
    throw new Error("Failed to upload image")
  }
}
