package com.metizo.backend.service;

import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Stores uploaded files on the local filesystem under a configurable directory.
 * For production this would be swapped for object storage (S3, Cloudinary, etc.).
 */
@Service
public class FileStorageService {

    private final Path root;

    public FileStorageService(@Value("${metizo.uploads.dir:uploads}") String uploadsDir) {
        this.root = Paths.get(uploadsDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    void init() {
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create uploads directory: " + root, e);
        }
    }

    /** Persist the file under a random name and return that stored filename. */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String stored = UUID.randomUUID() + (ext != null ? "." + ext.toLowerCase() : "");
        try {
            Path target = root.resolve(stored).normalize();
            // Guard against path traversal via a crafted filename.
            if (!target.getParent().equals(root)) {
                throw new BadRequestException("Invalid file path");
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store file", e);
        }
        return stored;
    }

    public Resource load(String storedFilename) {
        try {
            Path file = root.resolve(storedFilename).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("File not found: " + storedFilename);
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("File not found: " + storedFilename);
        }
    }
}
