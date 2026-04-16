package com.virtualclassroom.study_sanctuary.service;

import org.apache.pdfbox.Loader; // Note: 3.x uses 'Loader' instead of 'PDDocument.load'
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class PdfService {

    public String extractText(MultipartFile file) throws IOException {
        // PDFBox 3.x syntax
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);

            return text.replaceAll("\\s+", " ").trim();
        }
    }
}
