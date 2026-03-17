"use client"

import * as React from "react"
import { useDropzone, DropzoneOptions, FileRejection } from "react-dropzone"
import { Cloud, File, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
    onFileSelect: (file: File | null) => void
    accept?: DropzoneOptions["accept"]
    maxSize?: DropzoneOptions["maxSize"]
    maxFiles?: DropzoneOptions["maxFiles"]
}

export function FileUploader({
    onFileSelect,
    accept = { "image/*": [".jpeg", ".jpg", ".png", ".dcm"], "video/*": [".mp4", ".webm", ".mov", ".avi", ".mkv"] },
    maxSize = 52428800, // 50MB for video support
    maxFiles = 1,
    className,
    ...props
}: FileUploaderProps) {
    const [file, setFile] = React.useState<File | null>(null)
    const [preview, setPreview] = React.useState<string | null>(null)

    const onDrop = React.useCallback(
        (acceptedFiles: File[]) => {
            const selected = acceptedFiles[0]
            if (selected) {
                setFile(selected)
                onFileSelect(selected)

                // Create preview if it's an image or video
                if (selected.type.startsWith("image/") || selected.type.startsWith("video/")) {
                    const objectUrl = URL.createObjectURL(selected)
                    setPreview(objectUrl)
                } else {
                    setPreview(null)
                }
            }
        },
        [onFileSelect]
    )

    const onDropRejected = React.useCallback((fileRejections: FileRejection[]) => {
        const rejection = fileRejections[0]
        if (rejection) {
            toast.error("File upload failed", {
                description: rejection.errors[0]?.message || "The selected file is not supported or exceeds the 50MB size limit."
            })
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        onDropRejected,
        accept,
        maxSize,
        maxFiles,
    })

    // Cleanup preview URL
    React.useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview)
            }
        }
    }, [preview])

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation()
        setFile(null)
        setPreview(null)
        onFileSelect(null)
    }

    return (
        <div className={cn("relative", className)} {...props}>
            {!file ? (
                <div
                    {...getRootProps()}
                    className={cn(
                        "group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-14 text-center transition-all hover:bg-muted/50",
                        isDragActive && "border-primary bg-primary/5"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="rounded-full bg-primary/10 p-3 text-primary mb-4 transition-all group-hover:scale-110">
                        <Cloud className="h-8 w-8" />
                    </div>
                    <p className="mb-2 text-sm font-medium">
                        <span className="text-primary hover:underline">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                        MRI Scans (JPEG, PNG, DCM, MP4) up to 50MB
                    </p>
                </div>
            ) : (
                <div className="relative flex flex-col items-center justify-center rounded-lg border border-border p-4 shadow-sm bg-card overflow-hidden group">
                    <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button type="button" variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-sm" onClick={removeFile}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {preview ? (
                        <div className="relative h-48 w-full w-full rounded-md overflow-hidden bg-muted mb-4 flex items-center justify-center">
                            {file.type.startsWith("video/") ? (
                                <video src={preview} controls className="h-full w-full object-cover" />
                            ) : (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={preview} alt="MRI Preview" className="h-full w-full object-cover" />
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="h-24 w-full rounded-md bg-muted mb-4 flex items-center justify-center text-muted-foreground">
                            <File className="h-8 w-8 mb-2" />
                        </div>
                    )}

                    <div className="flex w-full items-center gap-3 bg-muted/50 p-3 rounded-md">
                        <File className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="flex flex-1 flex-col overflow-hidden">
                            <p className="truncate text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
