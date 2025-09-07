import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { ImageFile } from "@/store/productStore";

interface PhotoUploaderProps {
  mainImage?: string;
  additionalImages?: string[];
  onMainImageChange: (imageFile: ImageFile) => void;
  onAdditionalImagesChange: (imageFiles: ImageFile[]) => void;
  onRemoveAdditionalImage: (index: number) => void;
}

export const PhotoUploader = ({
  mainImage,
  additionalImages = [],
  onMainImageChange,
  onAdditionalImagesChange,
  onRemoveAdditionalImage
}: PhotoUploaderProps) => {
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const additionalImagesInputRef = useRef<HTMLInputElement>(null);
  
  const handleMainImageClick = () => {
    mainImageInputRef.current?.click();
  };
  
  const handleAdditionalImagesClick = () => {
    additionalImagesInputRef.current?.click();
  };
  
  const handleMainImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageFile: ImageFile = {
        url: URL.createObjectURL(file),
        file: file,
        name: file.name,
        size: file.size,
        type: file.type
      };
      onMainImageChange(imageFile);
    }
  };
  
  const handleAdditionalImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles: ImageFile[] = Array.from(files).map(file => ({
        url: URL.createObjectURL(file),
        file: file,
        name: file.name,
        size: file.size,
        type: file.type
      }));
      onAdditionalImagesChange(newFiles);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-paper w-full">
          Main Product Image
          <span className="text-xs text-graphite/70 ml-auto">Required</span>
        </label>
        <div 
          onClick={handleMainImageClick}
          className={`cursor-pointer border-2 border-dashed rounded-lg p-4 transition-all ${
            mainImage 
              ? 'border-accent/50 bg-accent/5' 
              : 'border-graphite/30 hover:border-graphite/50 hover:bg-mink/5'
          }`}
        >
          {mainImage ? (
            <div className="relative group">
              <img 
                src={mainImage} 
                alt="Main product" 
                className="w-full h-48 sm:h-64 md:h-72 object-cover rounded-md shadow-sm mx-auto" 
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                <Upload className="w-8 h-8 text-white mb-2" />
                <p className="text-white text-sm px-4 py-2 bg-black/40 rounded-full">Click to change image</p>
              </div>
              <div className="absolute bottom-4 right-4 bg-accent/90 text-white text-xs px-3 py-1 rounded-full">
                Main Image
              </div>
            </div>
          ) : (
            <div className="h-48 sm:h-64 md:h-72 flex flex-col items-center justify-center text-graphite bg-mink/5 rounded-md">
              <div className="bg-accent/10 rounded-full p-4 mb-4">
                <ImageIcon className="w-8 h-8 text-accent/80" />
              </div>
              <p className="text-sm font-medium">Click to upload main image</p>
              <p className="text-xs mt-1 text-graphite/70">PNG, JPG or WEBP (max. 5MB)</p>
              <div className="mt-4 px-4 py-2 border border-accent/30 rounded-full text-accent text-sm">
                Browse Files
              </div>
            </div>
          )}
          <input 
            ref={mainImageInputRef}
            type="file" 
            accept="image/*"
            className="hidden"
            onChange={handleMainImageChange}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-paper w-full">
          Additional Images
          <span className="text-xs text-graphite/70 ml-auto">Optional (up to 5)</span>
        </label>
        <div className="bg-mink/5 rounded-lg border border-graphite/10 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {additionalImages.map((image, index) => (
              <div key={index} className="relative group animate-fadeIn">
                <div className="aspect-square overflow-hidden rounded-md border border-graphite/20 group-hover:border-accent/30 transition-all bg-mink/10">
                  <img 
                    src={image} 
                    alt={`Product view ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">Image {index + 1}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveAdditionalImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 shadow flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {additionalImages.length < 5 && (
              <div 
                onClick={handleAdditionalImagesClick}
                className="cursor-pointer border-2 border-dashed border-graphite/30 rounded-md aspect-square flex flex-col items-center justify-center text-graphite hover:border-accent/50 hover:bg-accent/5 transition-all"
              >
                <div className="bg-mink/20 rounded-full p-2 mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs text-center px-2">Add More Images</span>
                <input 
                  ref={additionalImagesInputRef}
                  type="file" 
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAdditionalImagesChange}
                />
              </div>
            )}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-graphite/70">
              {additionalImages.length} of 5 additional images
            </p>
            {additionalImages.length === 0 && (
              <p className="text-amber-500/80 text-xs mt-1">
                Additional images help customers see your product from multiple angles
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
