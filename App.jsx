import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";
import JSZip from "jszip";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

// ============================================================================
// PRICING DATA
// ============================================================================

const FACADE_TYPES = [
  { name: "МЫЛО", price_16: 5500, price_19: 6000, price_22: 6500 },
  { name: "3Д", price_16: null, price_19: 7500, price_22: 8000 },
  { name: "Волна 31", price_16: null, price_19: 7500, price_22: 8000 },
  { name: "Волна 11", price_16: null, price_19: 7500, price_22: 8000 },
  { name: "Вельвет", price_16: null, price_19: 7500, price_22: 8000 },
  { name: "ЭЙВОН", price_16: 6000, price_19: 7000, price_22: 7500 },
  { name: "ТРЕНТ", price_16: 6000, price_19: 7000, price_22: 7500 },
  { name: "ХАГЕН 10", price_16: 6000, price_19: 7000, price_22: 7500 },
  { name: "ХАГЕН 20", price_16: 6000, price_19: 7000, price_22: 7500 },
  { name: "ХАГЕН 45", price_16: 6000, price_19: 7000, price_22: 7500 },
  { name: "ХАГЕН 60", price_16: 6000, price_19: 7000, price_22: 7500 },
  { name: "НЬЮАРК", price_16: 6000, price_19: 7000, price_22: 7500 },
  { name: "НЬЮАРК В", price_16: 6000, price_19: 7000, price_22: 7500 },
  { name: "Платина", price_16: 6000, price_19: 7000, price_22: 7500 },
  { name: "Виктория", price_16: 6000, price_19: 7000, price_22: 7500 },
  { name: "Эверест", price_16: 6000, price_19: 7000, price_22: 7500 },
  { name: "Выкса", price_16: 6000, price_19: 7000, price_22: 7500 },
  { name: "Апрель", price_16: 6000, price_19: 7000, price_22: 7500 },
  { name: "Фауст", price_16: 6000, price_19: 7000, price_22: 7500 },
  { name: "Ягода", price_16: 6000, price_19: 7000, price_22: 7500 },
  { name: "ЮГ", price_16: null, price_19: 7000, price_22: 7500 },
  { name: "Северин", price_16: 7000, price_19: 7000, price_22: 7500 },
  { name: "Восток", price_16: 7000, price_19: 7000, price_22: 7500 },
  { name: "Ярус", price_16: null, price_19: 7000, price_22: 7500 },
  { name: "Геометрия", price_16: 7000, price_19: 7000, price_22: 8000 },
  { name: "Интеграция ИР", price_16: null, price_19: 6500, price_22: 6500 },
  { name: "По чертежу", price_16: 8000, price_19: 8000, price_22: 8000 },
];

const EDGE_OPTIONS = [
  { name: "R1 мм", price: 20 },
  { name: "R2 мм", price: 20 },
  { name: "Ступенька", price: 30 },
];

const GLOSS_OPTIONS = [
  { name: "Матовый (5 глосс)", price: 0 },
  { name: "Полуглянец (20 глосс)", price: 1100 },
  { name: "Глянцевый (90 глосс)", price: 4000 },
];

const BACK_FINISH_OPTIONS = [
  { name: "Белая (белый пластик)", price: 0 },
  { name: "Покраска обратной стороны", price: 2800 },
  { name: "Глянцевая", price: 4000 },
];

const FACADE_STYLE_OPTIONS = [
  { name: "Глухой", price: 0 },
  { name: "Витрина", price: 500 },
  { name: "Витрина + Выборка под стекло", price: 1000 },
  { name: "Карниз H-35", price: 1450 },
  { name: "Карниз H-65", price: 1750 },
];

const ADDITIONAL_OPTIONS = [
  { name: "Доп слой лака (20 глосс)", price: 2000 },
  { name: "Доп слой лака (5 глосс)", price: 1500 },
  { name: "Патина (Уточнить)", price: 3000 },
];

const DRILLING_OPTIONS = [
  { name: "Базис Файл", price: 150 },
  { name: "См.Чертёж", price: 150 },
  { name: "НЕТ", price: 0 },
];

const PACKAGING_OPTIONS = [
  { name: "Стрейч", price: 0 },
  { name: "Стрейч+мягкая", price: 300 },
  { name: "Стрейч+мягкая+уголки", price: 450 },
];

const DELIVERY_OPTIONS = [
  { name: "Самовывоз", price: 0 },
  { name: "Доставка", price: 700 },
];

const GLOBAL_FINISHING_OPTIONS = [
  { name: "", price: 0, label: "Нет" },
  { name: "Доп слой лака (5 глосс)", price: 1500 },
  { name: "Доп слой лака (20 глосс)", price: 2000 },
  { name: "Патина", price: 3000 },
];

const GLOBAL_SETTINGS = {
  currency: "RUB",
  minArea: 0.1,
  discount: 0,
};

// ============================================================================
// MAZARTI LOGO COMPONENT
// ============================================================================
const LOGO_DATA_URI = "data:image/jpeg;base64,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";

const MazartiLogo = () => (
  <img 
    src={LOGO_DATA_URI}
    alt="MAZARTI Logo"
    className="w-full h-full object-contain rounded-full"
  />
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function App() {
  const [orderInfo, setOrderInfo] = useState({
    orderId: `MZ-${Date.now().toString().slice(-6)}`,
    customer: "",
    color: "", // New color field
    date: new Date().toISOString().split('T')[0],
    status: "Новый"
  });

  const [items, setItems] = useState([
    {
      id: 1,
      facadeType: "ЭЙВОН",
      thickness: "19",
      height: 716,
      width: 396,
      quantity: 1,
      edge: "R1 мм",
      gloss: "Матовый (5 глосс)",
      backFinish: "Белая (белый пластик)",
      facadeStyle: "Глухой",
      additional: "",
      drilling: "Базис Файл",
    }
  ]);

  const [globalOptions, setGlobalOptions] = useState({
    packaging: "Стрейч",
    delivery: "Самовывоз",
    globalFinishing: "", // Changed from discount to global finishing
  });

  // Calculation engine
  const calculations = useMemo(() => {
    const calculatedItems = items.map(item => {
      const facade = FACADE_TYPES.find(f => f.name === item.facadeType);
      const thicknessKey = `price_${item.thickness}`;
      const basePrice = facade?.[thicknessKey] || 0;

      if (basePrice === null || basePrice === 0) {
        return { ...item, error: "Не производится", total: 0 };
      }

      const area = (item.height * item.width) / 1000000;
      const effectiveArea = Math.max(area, GLOBAL_SETTINGS.minArea);
      const isMinAreaApplied = area < GLOBAL_SETTINGS.minArea;
      const perimeter = ((item.height + item.width) * 2) / 1000;

      const edgePrice = EDGE_OPTIONS.find(e => e.name === item.edge)?.price || 0;
      const glossPrice = GLOSS_OPTIONS.find(g => g.name === item.gloss)?.price || 0;
      const backFinishPrice = BACK_FINISH_OPTIONS.find(b => b.name === item.backFinish)?.price || 0;
      const facadeStylePrice = FACADE_STYLE_OPTIONS.find(f => f.name === item.facadeStyle)?.price || 0;
      const additionalPrice = item.additional ? (ADDITIONAL_OPTIONS.find(a => a.name === item.additional)?.price || 0) : 0;
      const drillingPrice = DRILLING_OPTIONS.find(d => d.name === item.drilling)?.price || 0;

      const facadeCost = basePrice * effectiveArea;
      const edgeCost = edgePrice * perimeter;
      const glossCost = glossPrice * effectiveArea;
      const backFinishCost = backFinishPrice * effectiveArea;
      const facadeStyleCost = facadeStylePrice * effectiveArea;
      const additionalCost = additionalPrice * effectiveArea;
      const drillingCost = drillingPrice;

      const itemTotal = facadeCost + edgeCost + glossCost + backFinishCost + 
                       facadeStyleCost + additionalCost + drillingCost;
      const lineTotal = itemTotal * item.quantity;

      return {
        ...item,
        area: area.toFixed(4),
        effectiveArea: effectiveArea.toFixed(4),
        isMinAreaApplied,
        perimeter: perimeter.toFixed(2),
        breakdown: {
          facade: Math.round(facadeCost),
          edge: Math.round(edgeCost),
          gloss: Math.round(glossCost),
          backFinish: Math.round(backFinishCost),
          facadeStyle: Math.round(facadeStyleCost),
          additional: Math.round(additionalCost),
          drilling: Math.round(drillingCost),
        },
        itemTotal: Math.round(itemTotal),
        lineTotal: Math.round(lineTotal),
      };
    });

    const itemsSubtotal = calculatedItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
    const packagingCost = PACKAGING_OPTIONS.find(p => p.name === globalOptions.packaging)?.price || 0;
    const deliveryCost = DELIVERY_OPTIONS.find(d => d.name === globalOptions.delivery)?.price || 0;
    
    // Global finishing cost (price per m² for all items)
    const globalFinishingPricePerM2 = GLOBAL_FINISHING_OPTIONS.find(f => f.name === globalOptions.globalFinishing)?.price || 0;
    const totalArea = calculatedItems.reduce((sum, item) => sum + (parseFloat(item.effectiveArea) * item.quantity), 0);
    const globalFinishingCost = globalFinishingPricePerM2 * totalArea;
    
    const subtotal = itemsSubtotal + packagingCost + deliveryCost + globalFinishingCost;
    const discountAmount = 0; // No discount
    const total = subtotal;

    return {
      items: calculatedItems,
      itemsSubtotal: Math.round(itemsSubtotal),
      packagingCost: Math.round(packagingCost),
      deliveryCost: Math.round(deliveryCost),
      globalFinishingCost: Math.round(globalFinishingCost),
      globalFinishingName: globalOptions.globalFinishing || "Нет",
      totalArea: totalArea.toFixed(2),
      subtotal: Math.round(subtotal),
      discountAmount: 0,
      total: Math.round(total),
    };
  }, [items, globalOptions]);

  // Handlers
  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addRow = () => {
    const newId = Math.max(...items.map(i => i.id), 0) + 1;
    const lastItem = items[items.length - 1]; // Get the last item
    
    // Clone the last item's settings but with new ID and quantity reset to 1
    setItems([...items, {
      ...lastItem, // Copy all properties from last item
      id: newId,
      quantity: 1, // Reset quantity to 1 for new row
    }]);
  };

  const deleteRow = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const resetForm = () => {
    setOrderInfo({
      orderId: `MZ-${Date.now().toString().slice(-6)}`,
      customer: "",
      color: "",
      date: new Date().toISOString().split('T')[0],
      status: "Новый"
    });
    setItems([{
      id: 1,
      facadeType: "ЭЙВОН",
      thickness: "19",
      height: 716,
      width: 396,
      quantity: 1,
      edge: "R1 мм",
      gloss: "Матовый (5 глосс)",
      backFinish: "Белая (белый пластик)",
      facadeStyle: "Глухой",
      additional: "",
      drilling: "Базис Файл",
    }]);
    setGlobalOptions({
      packaging: "Стрейч",
      delivery: "Самовывоз",
      globalFinishing: "",
    });
    setAttachments([]); // Clear attachments
  };

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(null); // Track OCR progress
  const [attachments, setAttachments] = useState([]); // Store uploaded drawings/files

  const handleAddDrawing = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      const fileExt = file.name.split('.').pop().toLowerCase();
      const allowedExts = ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp', 'pdf', 'xlsx', 'xls', 'csv'];
      
      if (!allowedExts.includes(fileExt)) {
        alert(`❌ Файл ${file.name} имеет неподдерживаемый формат`);
        return;
      }

      // Create file preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const newAttachment = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: fileExt,
          size: file.size,
          preview: fileExt.match(/(jpg|jpeg|png|bmp|webp)/) ? e.target.result : null,
          file: file,
          uploadDate: new Date().toISOString()
        };
        
        setAttachments(prev => [...prev, newAttachment]);
      };
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
    
    event.target.value = ''; // Reset input
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const downloadAttachment = (attachment) => {
    const url = URL.createObjectURL(attachment.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadFromJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Load order info
        if (data.orderInfo) {
          setOrderInfo(data.orderInfo);
        }
        
        // Load items
        if (data.items) {
          setItems(data.items);
        }
        
        // Load global options
        if (data.globalOptions) {
          setGlobalOptions(data.globalOptions);
        }
        
        alert('✅ Заказ успешно загружен!');
      } catch (error) {
        alert('❌ Ошибка при загрузке файла. Проверьте формат JSON.');
        console.error('Error loading JSON:', error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Smart column mapping - finds columns by various names
  const findColumn = (headers, possibleNames) => {
    const normalizedHeaders = headers.map(h => (h || '').toString().toLowerCase().trim());
    for (const name of possibleNames) {
      const index = normalizedHeaders.findIndex(h => h.includes(name.toLowerCase()));
      if (index !== -1) return index;
    }
    return -1;
  };

  // Smart material matching
  const matchFacadeType = (value) => {
    if (!value) return "ЭЙВОН";
    const normalized = value.toString().toLowerCase().trim();
    const match = FACADE_TYPES.find(f => 
      f.name.toLowerCase() === normalized || 
      f.name.toLowerCase().includes(normalized) ||
      normalized.includes(f.name.toLowerCase())
    );
    return match ? match.name : "ЭЙВОН";
  };

  const matchThickness = (value) => {
    if (!value) return "19";
    const str = value.toString().replace(/[^\d]/g, '');
    if (str === "16" || str === "19" || str === "22") return str;
    return "19";
  };

  // Parse image file with OCR (handwriting recognition)
  const parseImage = async (file) => {
    if (!Tesseract) {
      throw new Error('Tesseract.js библиотека не загружена. Добавьте скрипт в HTML.');
    }

    return new Promise(async (resolve, reject) => {
      try {
        setOcrProgress({ status: 'loading', progress: 0 });

        // Create image URL
        const imageUrl = URL.createObjectURL(file);

        // Perform OCR with progress tracking
        const { data } = await Tesseract.recognize(
          imageUrl,
          'rus+eng', // Russian and English languages
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                setOcrProgress({ 
                  status: 'recognizing', 
                  progress: Math.round(m.progress * 100) 
                });
              }
            }
          }
        );

        URL.revokeObjectURL(imageUrl);
        setOcrProgress(null);

        const recognizedText = data.text;

        if (!recognizedText || recognizedText.trim().length < 5) {
          reject(new Error('Не удалось распознать текст на изображении'));
          return;
        }

        // Parse dimensions from recognized text
        const parsedItems = [];
        const errors = [];

        // Pattern 1: "716x396" or "716х396" (with cyrillic х)
        const pattern1 = /(\d{2,4})\s*[xхXХ*×]\s*(\d{2,4})/g;
        
        // Pattern 2: Two numbers on the same line with possible separators
        const pattern2 = /(\d{2,4})\s*[\/\-,;]\s*(\d{2,4})/g;
        
        // Pattern 3: Lines with dimension keywords
        const lines = recognizedText.split('\n');
        
        let foundDimensions = [];

        // Try pattern 1 first (most reliable)
        let match;
        while ((match = pattern1.exec(recognizedText)) !== null) {
          const height = parseInt(match[1]);
          const width = parseInt(match[2]);
          
          if (height >= 50 && height <= 3000 && width >= 50 && width <= 3000) {
            foundDimensions.push({ height, width, confidence: 'high' });
          }
        }

        // Try pattern 2
        while ((match = pattern2.exec(recognizedText)) !== null) {
          const height = parseInt(match[1]);
          const width = parseInt(match[2]);
          
          if (height >= 50 && height <= 3000 && width >= 50 && width <= 3000) {
            const exists = foundDimensions.some(d => d.height === height && d.width === width);
            if (!exists) {
              foundDimensions.push({ height, width, confidence: 'medium' });
            }
          }
        }

        // Pattern 3: Context-based search
        if (foundDimensions.length < 5) { // Only if we haven't found many dimensions yet
          lines.forEach((line, idx) => {
            const lowerLine = line.toLowerCase();
            
            // Check if line contains dimension-related keywords
            const hasDimensionContext = 
              lowerLine.includes('размер') ||
              lowerLine.includes('высота') ||
              lowerLine.includes('ширина') ||
              lowerLine.includes('габарит') ||
              lowerLine.includes('мм') ||
              lowerLine.includes('см') ||
              lowerLine.includes('в') && lowerLine.includes('ш');

            if (hasDimensionContext) {
              const searchLines = [
                lines[idx - 1] || '',
                line,
                lines[idx + 1] || ''
              ].join(' ');

              const numbers = searchLines.match(/\d{2,4}/g);
              if (numbers && numbers.length >= 2) {
                for (let i = 0; i < numbers.length - 1; i += 2) {
                  const height = parseInt(numbers[i]);
                  const width = parseInt(numbers[i + 1]);
                  
                  if (height >= 50 && height <= 3000 && width >= 50 && width <= 3000) {
                    const exists = foundDimensions.some(d => d.height === height && d.width === width);
                    if (!exists) {
                      foundDimensions.push({ height, width, confidence: 'low' });
                    }
                  }
                }
              }
            }
          });
        }

        // Look for quantity patterns
        const quantityPatterns = [
          /кол[иь]?[чв]?[еао]?[:\s]+(\d+)/gi,
          /qty[:\s]+(\d+)/gi,
          /шт\.?[:\s]+(\d+)/gi,
          /количество[:\s]+(\d+)/gi,
          /(\d+)\s*шт/gi
        ];

        const quantities = [];
        quantityPatterns.forEach(pattern => {
          let qMatch;
          const text = recognizedText;
          while ((qMatch = pattern.exec(text)) !== null) {
            quantities.push(parseInt(qMatch[1]));
          }
        });

        // Look for facade types
        const detectedFacades = [];
        FACADE_TYPES.forEach(facade => {
          const facadePattern = new RegExp(facade.name, 'gi');
          if (facadePattern.test(recognizedText)) {
            detectedFacades.push(facade.name);
          }
        });

        // Create items from found dimensions
        foundDimensions.forEach((dim, idx) => {
          const quantity = quantities[idx] || 1;
          const facadeType = detectedFacades[idx] || "ЭЙВОН";
          
          parsedItems.push({
            id: Date.now() + idx,
            facadeType: facadeType,
            thickness: "19",
            height: dim.height,
            width: dim.width,
            quantity: quantity,
            edge: "R1 мм",
            gloss: "Матовый (5 глосс)",
            backFinish: "Белая (белый пластик)",
            facadeStyle: "Глухой",
            additional: "",
            drilling: "Базис Файл",
            hasError: false,
            confidence: dim.confidence
          });
        });

        if (parsedItems.length === 0) {
          reject(new Error('На изображении не найдено размеров. Проверьте качество фото и четкость текста.'));
          return;
        }

        resolve({ 
          items: parsedItems, 
          errors, 
          source: 'ocr',
          recognizedText: recognizedText 
        });
      } catch (error) {
        setOcrProgress(null);
        reject(new Error(`Ошибка при распознавании изображения: ${error.message}`));
      }
    });
  };

  // Parse PDF file with text extraction
  const parsePDF = async (file) => {
    if (!pdfjsLib) {
      throw new Error('PDF.js библиотека не загружена. Добавьте скрипт в HTML.');
    }

    return new Promise(async (resolve, reject) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let allText = '';
        let hasText = false;

        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          if (textContent.items.length > 0) {
            hasText = true;
          }

          // Group text items by their vertical position (y coordinate)
          const lines = {};
          textContent.items.forEach(item => {
            const y = Math.round(item.transform[5]); // Y coordinate
            if (!lines[y]) lines[y] = [];
            lines[y].push({
              text: item.str,
              x: item.transform[4]
            });
          });

          // Sort items in each line by X coordinate and join
          Object.keys(lines).forEach(y => {
            lines[y].sort((a, b) => a.x - b.x);
            const lineText = lines[y].map(item => item.text).join(' ');
            allText += lineText + '\n';
          });
        }

        // Check if PDF is a scanned image (no text)
        if (!hasText || allText.trim().length < 10) {
          reject(new Error('SCANNED_PDF'));
          return;
        }

        // Parse dimensions from text using various patterns
        const parsedItems = [];
        const errors = [];

        // Pattern 1: "716x396" or "716х396" (with cyrillic х)
        const pattern1 = /(\d{2,4})\s*[xхXХ*×]\s*(\d{2,4})/g;
        
        // Pattern 2: Two numbers on the same line
        const pattern2 = /(\d{2,4})\s+(\d{2,4})/g;
        
        // Pattern 3: Lines with "высота/ширина" keywords
        const lines = allText.split('\n');
        
        let foundDimensions = [];

        // Try pattern 1 first (most reliable)
        let match;
        while ((match = pattern1.exec(allText)) !== null) {
          const height = parseInt(match[1]);
          const width = parseInt(match[2]);
          
          if (height >= 50 && height <= 3000 && width >= 50 && width <= 3000) {
            foundDimensions.push({ height, width, confidence: 'high' });
          }
        }

        // If pattern 1 didn't find anything, try pattern 2 with context
        if (foundDimensions.length === 0) {
          lines.forEach((line, idx) => {
            const lowerLine = line.toLowerCase();
            
            // Check if line contains dimension-related keywords
            const hasDimensionContext = 
              lowerLine.includes('размер') ||
              lowerLine.includes('высота') ||
              lowerLine.includes('ширина') ||
              lowerLine.includes('габарит') ||
              lowerLine.includes('мм') ||
              lowerLine.includes('см');

            if (hasDimensionContext) {
              // Look for number pairs in this line and nearby lines
              const searchLines = [
                lines[idx - 1] || '',
                line,
                lines[idx + 1] || ''
              ].join(' ');

              const numbers = searchLines.match(/\d{2,4}/g);
              if (numbers && numbers.length >= 2) {
                for (let i = 0; i < numbers.length - 1; i += 2) {
                  const height = parseInt(numbers[i]);
                  const width = parseInt(numbers[i + 1]);
                  
                  if (height >= 50 && height <= 3000 && width >= 50 && width <= 3000) {
                    foundDimensions.push({ height, width, confidence: 'medium' });
                  }
                }
              }
            }
          });
        }

        // Look for quantity patterns
        const quantityPatterns = [
          /кол[иь]?[чв]?[еао]?:?\s*(\d+)/gi,
          /qty:?\s*(\d+)/gi,
          /шт\.?:?\s*(\d+)/gi,
          /количество:?\s*(\d+)/gi
        ];

        const quantities = [];
        quantityPatterns.forEach(pattern => {
          let qMatch;
          while ((qMatch = pattern.exec(allText)) !== null) {
            quantities.push(parseInt(qMatch[1]));
          }
        });

        // Create items from found dimensions
        foundDimensions.forEach((dim, idx) => {
          const quantity = quantities[idx] || 1;
          
          parsedItems.push({
            id: Date.now() + idx,
            facadeType: "ЭЙВОН",
            thickness: "19",
            height: dim.height,
            width: dim.width,
            quantity: quantity,
            edge: "R1 мм",
            gloss: "Матовый (5 глосс)",
            backFinish: "Белая (белый пластик)",
            facadeStyle: "Глухой",
            additional: "",
            drilling: "Базис Файл",
            hasError: false,
            confidence: dim.confidence
          });
        });

        if (parsedItems.length === 0) {
          reject(new Error('В PDF не найдено размеров. Проверьте формат файла.'));
          return;
        }

        resolve({ items: parsedItems, errors, source: 'pdf' });
      } catch (error) {
        if (error.message === 'SCANNED_PDF') {
          reject(error);
        } else {
          reject(new Error(`Ошибка при чтении PDF: ${error.message}`));
        }
      }
    });
  };

  // Parse Excel/CSV file
  const parseFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
          
          if (jsonData.length < 2) {
            reject(new Error('Файл пустой или содержит только заголовки'));
            return;
          }

          const headers = jsonData[0];
          const rows = jsonData.slice(1);

          // Find columns
          const heightCol = findColumn(headers, ['высота', 'height', 'h', 'в']);
          const widthCol = findColumn(headers, ['ширина', 'width', 'w', 'ш']);
          const quantityCol = findColumn(headers, ['количество', 'кол-во', 'кол', 'qty', 'quantity', 'qnt']);
          const facadeCol = findColumn(headers, ['фасад', 'тип', 'материал', 'facade', 'type']);
          const thicknessCol = findColumn(headers, ['толщина', 'thickness', 'т']);

          if (heightCol === -1 || widthCol === -1) {
            reject(new Error('Не найдены обязательные столбцы: Высота и Ширина'));
            return;
          }

          // Parse rows
          const parsedItems = [];
          const errors = [];

          rows.forEach((row, idx) => {
            const height = parseInt(row[heightCol]);
            const width = parseInt(row[widthCol]);
            const quantity = quantityCol !== -1 ? parseInt(row[quantityCol]) || 1 : 1;
            const facadeType = facadeCol !== -1 ? matchFacadeType(row[facadeCol]) : "ЭЙВОН";
            const thickness = thicknessCol !== -1 ? matchThickness(row[thicknessCol]) : "19";

            if (isNaN(height) || isNaN(width) || height <= 0 || width <= 0) {
              errors.push({ row: idx + 2, height: row[heightCol], width: row[widthCol] });
              return;
            }

            parsedItems.push({
              id: Date.now() + idx,
              facadeType,
              thickness,
              height,
              width,
              quantity,
              edge: "R1 мм",
              gloss: "Матовый (5 глосс)",
              backFinish: "Белая (белый пластик)",
              facadeStyle: "Глухой",
              additional: "",
              drilling: "Базис Файл",
              hasError: false
            });
          });

          resolve({ items: parsedItems, errors });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (fileExt === 'json') {
      // Handle JSON files
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.orderInfo) setOrderInfo(data.orderInfo);
          if (data.items) setItems(data.items);
          if (data.globalOptions) setGlobalOptions(data.globalOptions);
          setUploadModalOpen(false);
          alert('✅ Заказ успешно загружен из JSON!');
        } catch (error) {
          alert('❌ Ошибка при загрузке JSON файла');
        }
      };
      reader.readAsText(file);
    } else if (['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp'].includes(fileExt)) {
      // Handle image files with OCR
      try {
        const { items: parsedItems, errors, recognizedText } = await parseImage(file);
        
        if (parsedItems.length === 0) {
          alert('❌ На изображении не найдено размеров');
          return;
        }

        setItems(parsedItems);
        setUploadModalOpen(false);

        const highConfidence = parsedItems.filter(i => i.confidence === 'high').length;
        const mediumConfidence = parsedItems.filter(i => i.confidence === 'medium').length;
        const lowConfidence = parsedItems.filter(i => i.confidence === 'low').length;

        let message = `✅ Распознано ${parsedItems.length} позиций с фото\n\n`;
        if (highConfidence > 0) {
          message += `📊 Высокая точность: ${highConfidence} позиций\n`;
        }
        if (mediumConfidence > 0) {
          message += `📊 Средняя точность: ${mediumConfidence} позиций\n`;
        }
        if (lowConfidence > 0) {
          message += `📊 Низкая точность: ${lowConfidence} позиций\n`;
        }
        message += `\n⚠️ Рукописный текст распознан.\n⚠️ ОБЯЗАТЕЛЬНО проверьте все размеры!\n\n`;
        message += `💡 Для лучшего результата используйте:\n• Четкое фото при хорошем освещении\n• Печатный текст вместо рукописного\n• Excel файл для точности`;
        
        alert(message);
      } catch (error) {
        setOcrProgress(null);
        alert(`❌ Ошибка при распознавании изображения:\n${error.message}\n\n💡 Советы:\n• Убедитесь что фото четкое\n• Используйте хорошее освещение\n• Для рукописного текста пишите разборчиво`);
      }
    } else if (fileExt === 'pdf') {
      // Handle PDF files
      try {
        const { items: parsedItems, errors } = await parsePDF(file);
        
        if (parsedItems.length === 0) {
          alert('❌ В PDF не найдено размеров');
          return;
        }

        setItems(parsedItems);
        setUploadModalOpen(false);

        const highConfidence = parsedItems.filter(i => i.confidence === 'high').length;
        const mediumConfidence = parsedItems.filter(i => i.confidence === 'medium').length;

        let message = `✅ Успешно распознано ${parsedItems.length} позиций из PDF\n\n`;
        if (highConfidence > 0) {
          message += `📊 Высокая точность: ${highConfidence} позиций (формат "716x396")\n`;
        }
        if (mediumConfidence > 0) {
          message += `📊 Средняя точность: ${mediumConfidence} позиций (контекстный анализ)\n`;
        }
        message += `\n⚠️ Рекомендуется проверить размеры вручную!`;
        
        alert(message);
      } catch (error) {
        if (error.message === 'SCANNED_PDF') {
          alert('❌ Файл распознан как изображение (скан)\n\nДанный PDF не содержит текстового слоя.\nПожалуйста, используйте:\n• Текстовый PDF\n• Excel файл\n• CSV файл');
        } else {
          alert(`❌ Ошибка при обработке PDF: ${error.message}`);
        }
      }
    } else if (['xlsx', 'xls', 'csv'].includes(fileExt)) {
      // Handle Excel/CSV files
      try {
        const { items: parsedItems, errors } = await parseFile(file);
        
        if (parsedItems.length === 0) {
          alert('❌ Не удалось извлечь данные из файла');
          return;
        }

        setItems(parsedItems);
        setUploadModalOpen(false);

        let message = `✅ Успешно загружено ${parsedItems.length} позиций`;
        if (errors.length > 0) {
          message += `\n\n⚠️ Пропущено ${errors.length} строк с ошибками:`;
          errors.slice(0, 5).forEach(err => {
            message += `\nСтрока ${err.row}: В=${err.height}, Ш=${err.width}`;
          });
          if (errors.length > 5) {
            message += `\n... и еще ${errors.length - 5} строк`;
          }
        }
        alert(message);
      } catch (error) {
        alert(`❌ Ошибка при обработке файла: ${error.message}`);
      }
    } else {
      alert('❌ Неподдерживаемый формат файла.\n\nПоддерживаются:\n• Изображения (JPG, PNG, BMP, TIFF)\n• PDF (с текстовым слоем)\n• Excel (XLSX, XLS)\n• CSV\n• JSON');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const exportToJSON = () => {
    const data = {
      orderInfo,
      items,
      globalOptions,
      calculations: {
        total: calculations.total,
        subtotal: calculations.subtotal,
        discount: calculations.discountAmount,
      },
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MAZARTI_Order_${orderInfo.orderId}_${orderInfo.date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendOrderByEmail = async () => {
    try {
      if (!JSZip) {
        alert('❌ Библиотека JSZip не загружена.\nДобавьте в HTML:\n<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>');
        return;
      }

      // Show processing message
      const processingMsg = document.createElement('div');
      processingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1f2937;color:white;padding:30px 50px;border-radius:10px;z-index:9999;box-shadow:0 10px 40px rgba(0,0,0,0.5);text-align:center;';
      processingMsg.innerHTML = `
        <div style="font-size:18px;margin-bottom:15px;">📦 Подготовка документов...</div>
        <div style="font-size:14px;color:#9ca3af;">Это может занять несколько секунд</div>
      `;
      document.body.appendChild(processingMsg);

      // Create ZIP archive
      const zip = new JSZip();
      
      // 1. Generate Excel file and add to ZIP
      if (XLSX) {
        try {
          // Create Excel workbook (same code as exportToExcel)
          const wb = XLSX.utils.book_new();
          const ws_data = [];
          
          // Build Excel data (same as exportToExcel function)
          ws_data.push([]);
          ws_data.push(['Заказчик:', orderInfo.customer || '', '', '', '', 'Цвет', 'Номер Заказа']);
          ws_data.push(['Дата:', new Date(orderInfo.date).toLocaleDateString('ru-RU'), '', '', '', orderInfo.color || '', orderInfo.orderId || '']);
          ws_data.push(['Дата отгрузки:', '', '', '', '', '', '']);
          ws_data.push([]);
          
          const firstItem = calculations.items[0];
          if (firstItem) {
            const specLine = `МДФ ${firstItem.thickness}мм / ${firstItem.facadeType} / ${firstItem.edge} / ${firstItem.gloss} / ${firstItem.backFinish} / ${firstItem.additional || 'нет'}`;
            ws_data.push([specLine, '', '', '', '', '', '', '', '']);
          } else {
            ws_data.push(['МДФ 19мм / МЫЛО / R2 мм / Матовый (5 глосс) / Обратная Сторона / Доп', '', '', '', '', '', '', '', '']);
          }
          
          ws_data.push(['Размер', '', 'Тип', 'Кол-во', 'м.2', 'Комментарий', 'Примечание', '', '']);
          ws_data.push(['Высота', 'Ширина', '', '', '', '', '', '', '']);
          
          for (let i = 0; i < 5; i++) {
            const item = calculations.items[i];
            if (item) {
              const comment = `${item.edge}, ${item.gloss}`;
              const note = item.isMinAreaApplied ? 'Мин. площадь 0.1м²' : '';
              ws_data.push([item.height, item.width, item.facadeStyle, item.quantity, parseFloat(item.effectiveArea), comment, note, '', '']);
            } else {
              ws_data.push(['', '', '', '', '', '', '', '', '']);
            }
          }
          
          const totalQuantity = calculations.items.reduce((sum, item) => sum + item.quantity, 0);
          const totalArea = calculations.items.reduce((sum, item) => sum + (parseFloat(item.effectiveArea) * item.quantity), 0);
          ws_data.push(['', '', 'Итого', totalQuantity, parseFloat(totalArea.toFixed(4)), '', '', '', '']);
          
          ws_data.push([]);
          ws_data.push([]);
          ws_data.push([]);
          ws_data.push([]);
          ws_data.push(['Раскрой', '', '', '', '', '', '', '', '']);
          ws_data.push(['Торцовка', '', '', '', '', '', '', '', '']);
          ws_data.push(['Фрезеровка', '', '', '', '', '', '', '', '']);
          ws_data.push(['Шлифовка', '', '', '', '', '', '', '', '']);
          ws_data.push(['Сборка', '', '', '', '', '', '', '', '']);
          ws_data.push(['Грунт', '', '', '', '', '', '', '', '']);
          ws_data.push(['Эмаль', '', '', '', '', '', '', '', '']);
          
          const ws = XLSX.utils.aoa_to_sheet(ws_data);
          ws['!cols'] = [{ wch: 13 }, { wch: 14.7 }, { wch: 11.8 }, { wch: 13 }, { wch: 13 }, { wch: 24 }, { wch: 13 }, { wch: 13 }, { wch: 13 }];
          ws['!merges'] = [
            { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, { s: { r: 1, c: 2 }, e: { r: 1, c: 4 } }, 
            { s: { r: 1, c: 5 }, e: { r: 3, c: 5 } }, { s: { r: 1, c: 6 }, e: { r: 3, c: 8 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }, { s: { r: 2, c: 2 }, e: { r: 2, c: 4 } },
            { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }, { s: { r: 3, c: 2 }, e: { r: 3, c: 4 } },
            { s: { r: 5, c: 0 }, e: { r: 5, c: 8 } },
            { s: { r: 6, c: 0 }, e: { r: 7, c: 1 } }, { s: { r: 6, c: 2 }, e: { r: 7, c: 2 } },
            { s: { r: 6, c: 3 }, e: { r: 7, c: 3 } }, { s: { r: 6, c: 4 }, e: { r: 7, c: 4 } },
            { s: { r: 6, c: 5 }, e: { r: 7, c: 5 } }, { s: { r: 6, c: 6 }, e: { r: 7, c: 8 } },
            { s: { r: 18, c: 0 }, e: { r: 18, c: 1 } }, { s: { r: 19, c: 0 }, e: { r: 19, c: 1 } },
            { s: { r: 20, c: 0 }, e: { r: 20, c: 1 } }, { s: { r: 21, c: 0 }, e: { r: 21, c: 1 } },
            { s: { r: 22, c: 0 }, e: { r: 22, c: 1 } }, { s: { r: 23, c: 0 }, e: { r: 23, c: 1 } },
            { s: { r: 24, c: 0 }, e: { r: 24, c: 1 } },
          ];
          
          XLSX.utils.book_append_sheet(wb, ws, 'Лист1');
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          
          zip.file(`MAZARTI_Бланк_${orderInfo.orderId}.xlsx`, wbout);
        } catch (error) {
          console.error('Error creating Excel:', error);
        }
      }
      
      // 2. Add all attachments to ZIP
      if (attachments.length > 0) {
        const attachmentsFolder = zip.folder('Чертежи');
        for (const att of attachments) {
          attachmentsFolder.file(att.name, att.file);
        }
      }
      
      // 3. Create email text file with order details
      let emailText = `ЗАКАЗ MAZARTI №${orderInfo.orderId}\n`;
      emailText += `${'='.repeat(50)}\n\n`;
      emailText += `ИНФОРМАЦИЯ О ЗАКАЗЕ:\n`;
      emailText += `Заказчик: ${orderInfo.customer || 'Не указан'}\n`;
      emailText += `Цвет: ${orderInfo.color || 'Не указан'}\n`;
      emailText += `Дата: ${new Date(orderInfo.date).toLocaleDateString('ru-RU')}\n`;
      emailText += `\n${'='.repeat(50)}\n`;
      emailText += `ПОЗИЦИИ ЗАКАЗА:\n\n`;
      
      calculations.items.forEach((item, idx) => {
        emailText += `${idx + 1}. ${item.facadeType} (${item.thickness}мм)\n`;
        emailText += `   Размер: ${item.height}×${item.width} мм (${item.effectiveArea} м²)\n`;
        emailText += `   Количество: ${item.quantity} шт.\n`;
        emailText += `   Кромка: ${item.edge}\n`;
        emailText += `   Блеск: ${item.gloss}\n`;
        emailText += `   Обратная сторона: ${item.backFinish}\n`;
        emailText += `   Тип фасада: ${item.facadeStyle}\n`;
        if (item.additional) emailText += `   Доп. отделка: ${item.additional}\n`;
        emailText += `   Присадка: ${item.drilling}\n`;
        emailText += `   Стоимость: ${item.lineTotal.toLocaleString()} ₽\n\n`;
      });
      
      emailText += `${'='.repeat(50)}\n`;
      emailText += `ИТОГО:\n`;
      emailText += `Товары: ${calculations.itemsSubtotal.toLocaleString()} ₽\n`;
      emailText += `Упаковка (${globalOptions.packaging}): ${calculations.packagingCost.toLocaleString()} ₽\n`;
      emailText += `Доставка (${globalOptions.delivery}): ${calculations.deliveryCost.toLocaleString()} ₽\n`;
      if (calculations.globalFinishingCost > 0) {
        emailText += `Доп. отделка (${calculations.globalFinishingName}, ${calculations.totalArea} м²): ${calculations.globalFinishingCost.toLocaleString()} ₽\n`;
      }
      emailText += `\nИТОГО К ОПЛАТЕ: ${calculations.total.toLocaleString()} ₽\n`;
      emailText += `\n${'='.repeat(50)}\n`;
      emailText += `Отправлено через калькулятор MAZARTI\n`;
      emailText += `${new Date().toLocaleString('ru-RU')}\n`;
      
      zip.file('Описание_заказа.txt', emailText);
      
      // 4. Generate ZIP file
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      // 5. Download ZIP
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `MAZARTI_Заказ_${orderInfo.orderId}_${orderInfo.date}.zip`;
      a.click();
      URL.revokeObjectURL(zipUrl);
      
      // Remove processing message
      document.body.removeChild(processingMsg);
      
      // 6. Prepare mailto link
      const subject = `Заказ MAZARTI №${orderInfo.orderId}`;
      const body = `Добрый день!

Отправляю заказ №${orderInfo.orderId}.

ИНФОРМАЦИЯ О ЗАКАЗЕ:
• Заказчик: ${orderInfo.customer || 'Не указан'}
• Цвет: ${orderInfo.color || 'Не указан'}
• Дата: ${new Date(orderInfo.date).toLocaleDateString('ru-RU')}

СОСТАВ:
• Позиций: ${calculations.items.length}
• Общее количество: ${calculations.items.reduce((sum, item) => sum + item.quantity, 0)} шт.
• Общая площадь: ${calculations.totalArea} м²

ИТОГО К ОПЛАТЕ: ${calculations.total.toLocaleString()} ₽

📎 ВСЕ ДОКУМЕНТЫ НАХОДЯТСЯ В ПРИКРЕПЛЕННОМ ZIP-АРХИВЕ:
- Бланк на производство (Excel)
${attachments.length > 0 ? `- Чертежи и документы (${attachments.length} файл(ов))` : ''}
- Полное описание заказа (TXT)

Файл: MAZARTI_Заказ_${orderInfo.orderId}_${orderInfo.date}.zip

С уважением,
${orderInfo.customer || 'Клиент'}`;

      const mailtoLink = `mailto:mazartifasad@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Show success message with instructions
      const instructions = `✅ Архив с документами загружен!

📦 Файл: MAZARTI_Заказ_${orderInfo.orderId}_${orderInfo.date}.zip

Содержит:
• Бланк на производство (Excel)
${attachments.length > 0 ? `• Чертежи (${attachments.length} файл(ов))` : ''}
• Описание заказа (TXT)

📧 Сейчас откроется почтовый клиент.

ВАЖНО:
1. Прикрепите скачанный ZIP-файл к письму
2. Проверьте адрес: mazartifasad@gmail.com
3. Нажмите "Отправить"`;

      alert(instructions);
      
      // Open email client
      window.location.href = mailtoLink;
      
    } catch (error) {
      console.error('Error sending order:', error);
      alert(`❌ Ошибка при подготовке заказа:\n${error.message}\n\nПопробуйте еще раз или обратитесь в поддержку.`);
    }
  };

  const exportToExcel = async () => {
    try {
      if (!XLSX) {
        alert('❌ Библиотека XLSX не загружена. Добавьте скрипт в HTML.');
        return;
      }

      // Create a new workbook based on template structure
      const wb = XLSX.utils.book_new();
      
      // Create worksheet with template structure
      const ws_data = [];
      
      // Row 1: Empty
      ws_data.push([]);
      
      // Row 2: Заказчик, Цвет, Номер Заказа
      ws_data.push([
        'Заказчик:', orderInfo.customer || '', '', '', '', 'Цвет', 'Номер Заказа'
      ]);
      ws_data.push(['Дата:', new Date(orderInfo.date).toLocaleDateString('ru-RU'), '', '', '', orderInfo.color || '', orderInfo.orderId || '']);
      
      // Row 4: Дата отгрузки
      ws_data.push(['Дата отгрузки:', '', '', '', '', '', '']);
      
      // Row 5: Empty
      ws_data.push([]);
      
      // Row 6: Specification line (МДФ 19мм / МЫЛО / R2 мм / ...)
      const firstItem = calculations.items[0];
      if (firstItem) {
        const specLine = `МДФ ${firstItem.thickness}мм / ${firstItem.facadeType} / ${firstItem.edge} / ${firstItem.gloss} / ${firstItem.backFinish} / ${firstItem.additional || 'нет'}`;
        ws_data.push([specLine, '', '', '', '', '', '', '', '']);
      } else {
        ws_data.push(['МДФ 19мм / МЫЛО / R2 мм / Матовый (5 глосс) / Обратная Сторона / Доп', '', '', '', '', '', '', '', '']);
      }
      
      // Row 7-8: Headers
      ws_data.push(['Размер', '', 'Тип', 'Кол-во', 'м.2', 'Комментарий', 'Примечание', '', '']);
      ws_data.push(['Высота', 'Ширина', '', '', '', '', '', '', '']);
      
      // Rows 9-13: Data rows (5 rows for items)
      for (let i = 0; i < 5; i++) {
        const item = calculations.items[i];
        if (item) {
          const comment = `${item.edge}, ${item.gloss}`;
          const note = item.isMinAreaApplied ? 'Мин. площадь 0.1м²' : '';
          ws_data.push([
            item.height,
            item.width,
            item.facadeStyle,
            item.quantity,
            parseFloat(item.effectiveArea),
            comment,
            note,
            '',
            ''
          ]);
        } else {
          ws_data.push(['', '', '', '', '', '', '', '', '']);
        }
      }
      
      // Row 14: Totals
      const totalQuantity = calculations.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalArea = calculations.items.reduce((sum, item) => sum + (parseFloat(item.effectiveArea) * item.quantity), 0);
      ws_data.push(['', '', 'Итого', totalQuantity, parseFloat(totalArea.toFixed(4)), '', '', '', '']);
      
      // Rows 15-18: Empty
      ws_data.push([]);
      ws_data.push([]);
      ws_data.push([]);
      ws_data.push([]);
      
      // Rows 19-25: Production stages
      ws_data.push(['Раскрой', '', '', '', '', '', '', '', '']);
      ws_data.push(['Торцовка', '', '', '', '', '', '', '', '']);
      ws_data.push(['Фрезеровка', '', '', '', '', '', '', '', '']);
      ws_data.push(['Шлифовка', '', '', '', '', '', '', '', '']);
      ws_data.push(['Сборка', '', '', '', '', '', '', '', '']);
      ws_data.push(['Грунт', '', '', '', '', '', '', '', '']);
      ws_data.push(['Эмаль', '', '', '', '', '', '', '', '']);
      
      // Create worksheet from data
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 13 },  // A
        { wch: 14.7 }, // B
        { wch: 11.8 }, // C
        { wch: 13 },  // D
        { wch: 13 },  // E
        { wch: 24 },  // F
        { wch: 13 },  // G
        { wch: 13 },  // H
        { wch: 13 }   // I
      ];
      
      // Merge cells to match template
      ws['!merges'] = [
        // Row 2
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // A2:B2 Заказчик
        { s: { r: 1, c: 2 }, e: { r: 1, c: 4 } }, // C2:E2 (customer name)
        { s: { r: 1, c: 5 }, e: { r: 3, c: 5 } }, // F2:F4 Цвет
        { s: { r: 1, c: 6 }, e: { r: 3, c: 8 } }, // G2:I4 Номер Заказа
        
        // Row 3
        { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }, // A3:B3 Дата
        { s: { r: 2, c: 2 }, e: { r: 2, c: 4 } }, // C3:E3 (date value)
        
        // Row 4
        { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }, // A4:B4 Дата отгрузки
        { s: { r: 3, c: 2 }, e: { r: 3, c: 4 } }, // C4:E4 (delivery date)
        
        // Row 6 - Specification
        { s: { r: 5, c: 0 }, e: { r: 5, c: 8 } }, // A6:I6
        
        // Row 7-8 - Headers
        { s: { r: 6, c: 0 }, e: { r: 7, c: 1 } }, // A7:B8 Размер
        { s: { r: 6, c: 2 }, e: { r: 7, c: 2 } }, // C7:C8 Тип
        { s: { r: 6, c: 3 }, e: { r: 7, c: 3 } }, // D7:D8 Кол-во
        { s: { r: 6, c: 4 }, e: { r: 7, c: 4 } }, // E7:E8 м.2
        { s: { r: 6, c: 5 }, e: { r: 7, c: 5 } }, // F7:F8 Комментарий
        { s: { r: 6, c: 6 }, e: { r: 7, c: 8 } }, // G7:I8 Примечание
        
        // Production stages
        { s: { r: 18, c: 0 }, e: { r: 18, c: 1 } }, // A19:B19 Раскрой
        { s: { r: 19, c: 0 }, e: { r: 19, c: 1 } }, // A20:B20 Торцовка
        { s: { r: 20, c: 0 }, e: { r: 20, c: 1 } }, // A21:B21 Фрезеровка
        { s: { r: 21, c: 0 }, e: { r: 21, c: 1 } }, // A22:B22 Шлифовка
        { s: { r: 22, c: 0 }, e: { r: 22, c: 1 } }, // A23:B23 Сборка
        { s: { r: 23, c: 0 }, e: { r: 23, c: 1 } }, // A24:B24 Грунт
        { s: { r: 24, c: 0 }, e: { r: 24, c: 1 } }, // A25:B25 Эмаль
      ];
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Лист1');
      
      // Generate Excel file
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MAZARTI_Бланк_${orderInfo.orderId}_${orderInfo.date}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      
      alert('✅ Бланк на производство успешно создан и загружен!');
    } catch (error) {
      console.error('Error creating Excel:', error);
      alert(`❌ Ошибка при создании Excel файла:\n${error.message}`);
    }
  };

  const statusColors = {
    "Новый": "bg-blue-500/20 text-blue-300 border-blue-500/40",
    "В работе": "bg-orange-500/20 text-orange-300 border-orange-500/40",
    "Завершен": "bg-green-500/20 text-green-300 border-green-500/40",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 print:bg-white">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-600/30 print:hidden sticky top-0 z-50 shadow-lg">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex-shrink-0">
                <MazartiLogo />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-100 tracking-tight">MAZARTI</h1>
                <p className="text-sm text-gray-400">Калькулятор • Бланк Заявка</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 1. Новый Заказ */}
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all shadow-lg hover:shadow-green-500/30"
              >
                Новый Заказ
              </button>
              
              {/* 2. Загрузить Файл */}
              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-all shadow-lg hover:shadow-gray-500/30 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Загрузить Файл
              </button>
              
              {/* 3. Добавить Чертеж */}
              <label className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-500/30 cursor-pointer flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Добавить Чертеж
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.bmp,.tiff,.webp,.pdf,.xlsx,.xls,.csv"
                  onChange={handleAddDrawing}
                  className="hidden"
                />
              </label>
              {attachments.length > 0 && (
                <span className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium border border-purple-500/30">
                  {attachments.length} файл(ов)
                </span>
              )}
              
              {/* 4. Сохранить */}
              <button
                onClick={exportToJSON}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-all shadow-lg hover:shadow-gray-500/30 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Сохранить
              </button>
              
              {/* 5. Отправить Заказ */}
              <button
                onClick={sendOrderByEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Отправить Заказ
              </button>
              
              {/* Дополнительные кнопки (скрыты для упрощения интерфейса, можно вернуть при необходимости) */}
              <div className="hidden">
                <button onClick={exportToExcel}>Excel</button>
                <button onClick={() => window.print()}>Печать</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-6 py-6 print:px-8 print:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 print:grid-cols-1">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-4 print:hidden">
            {/* Order Info */}
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-600/30 p-5 shadow-lg">
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-4">Информация о заказе</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Номер заказа</label>
                  <input
                    type="text"
                    value={orderInfo.orderId}
                    onChange={(e) => setOrderInfo({...orderInfo, orderId: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Заказчик</label>
                  <input
                    type="text"
                    value={orderInfo.customer}
                    onChange={(e) => setOrderInfo({...orderInfo, customer: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Название компании"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Цвет</label>
                  <input
                    type="text"
                    value={orderInfo.color}
                    onChange={(e) => setOrderInfo({...orderInfo, color: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Цвет фасада"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Дата заказа</label>
                  <input
                    type="date"
                    value={orderInfo.date}
                    onChange={(e) => setOrderInfo({...orderInfo, date: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Global Options */}
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-600/30 p-5 shadow-lg">
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-4">Общие параметры</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Упаковка</label>
                  <select
                    value={globalOptions.packaging}
                    onChange={(e) => setGlobalOptions({...globalOptions, packaging: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-gray-500"
                  >
                    {PACKAGING_OPTIONS.map(opt => (
                      <option key={opt.name} value={opt.name}>{opt.name} ({opt.price === 0 ? 'вкл.' : `+${opt.price}₽`})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Доставка</label>
                  <select
                    value={globalOptions.delivery}
                    onChange={(e) => setGlobalOptions({...globalOptions, delivery: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-gray-500"
                  >
                    {DELIVERY_OPTIONS.map(opt => (
                      <option key={opt.name} value={opt.name}>{opt.name} ({opt.price === 0 ? 'вкл.' : `+${opt.price}₽`})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Доп. отделка</label>
                  <select
                    value={globalOptions.globalFinishing}
                    onChange={(e) => setGlobalOptions({...globalOptions, globalFinishing: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-gray-500"
                  >
                    {GLOBAL_FINISHING_OPTIONS.map(opt => (
                      <option key={opt.name} value={opt.name}>
                        {opt.label || opt.name} {opt.price > 0 ? `(+${opt.price}₽/м²)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Attachments Panel */}
            {attachments.length > 0 && (
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-purple-500/30 p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Чертежи ({attachments.length})
                  </h3>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {attachments.map(att => (
                    <div key={att.id} className="bg-gray-900/50 rounded-lg p-3 border border-gray-700 hover:border-purple-500/50 transition-colors">
                      <div className="flex items-start gap-3">
                        {att.preview ? (
                          <img src={att.preview} alt={att.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-400 uppercase font-bold">{att.type}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-300 truncate" title={att.name}>
                            {att.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(att.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => downloadAttachment(att)}
                            className="p-1.5 text-gray-400 hover:text-purple-400 transition-colors"
                            title="Скачать"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeAttachment(att.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                            title="Удалить"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-xl p-5 shadow-xl border border-gray-600">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-4 opacity-90">Итого к оплате</h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="opacity-80">Товары:</span>
                  <span className="font-medium">{calculations.itemsSubtotal.toLocaleString()} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">Упаковка:</span>
                  <span className="font-medium">{calculations.packagingCost.toLocaleString()} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">Доставка:</span>
                  <span className="font-medium">{calculations.deliveryCost.toLocaleString()} ₽</span>
                </div>
                {calculations.globalFinishingCost > 0 && (
                  <div className="flex justify-between">
                    <span className="opacity-80">Доп. отделка ({calculations.totalArea} м²):</span>
                    <span className="font-medium">{calculations.globalFinishingCost.toLocaleString()} ₽</span>
                  </div>
                )}
              </div>
              <div className="border-t border-white/30 pt-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-semibold">Сумма:</span>
                  <span className="text-3xl font-bold">{calculations.total.toLocaleString()} ₽</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Print Header */}
            <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">БЛАНК ЗАКАЗА</h1>
                  <div className="text-sm space-y-1">
                    <p><strong>Номер:</strong> {orderInfo.orderId}</p>
                    <p><strong>Заказчик:</strong> {orderInfo.customer || "_______________________"}</p>
                    <p><strong>Цвет:</strong> {orderInfo.color || "_______________________"}</p>
                    <p><strong>Дата:</strong> {new Date(orderInfo.date).toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-bold text-lg">MAZARTI</p>
                  <p className="text-slate-600">Искусство фасадов</p>
                  <p className="text-slate-600 mt-2">Тел: +7 (___) ___-__-__</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-600/30 shadow-xl print:bg-white print:shadow-none print:border-slate-300">
              <div className="px-6 py-4 border-b border-gray-600/30 flex justify-between items-center print:hidden">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">Позиции заказа</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Редактируйте параметры для пересчета</p>
                </div>
                <button
                  onClick={addRow}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-all shadow-lg hover:shadow-gray-500/30"
                >
                  + Добавить строку
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-700/50 border-b border-gray-600/30 print:bg-slate-100">
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-200 uppercase print:text-slate-700">#</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-200 uppercase print:text-slate-700 min-w-[140px]">Фасад</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-200 uppercase print:text-slate-700">Толщ.</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-200 uppercase print:text-slate-700">В×Ш</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-200 uppercase print:text-slate-700">S (м²)</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-200 uppercase print:text-slate-700">Кол.</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-200 uppercase print:text-slate-700 min-w-[110px]">Кромка</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-200 uppercase print:text-slate-700 min-w-[120px]">Блеск</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-200 uppercase print:text-slate-700 min-w-[130px]">Обр.ст.</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-200 uppercase print:text-slate-700 min-w-[110px]">Тип</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-200 uppercase print:text-slate-700">Итого</th>
                      <th className="px-3 py-3 print:hidden"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {calculations.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-700/20 print:hover:bg-transparent transition-colors">
                        <td className="px-3 py-3 font-medium text-gray-300 print:text-slate-900">{idx + 1}</td>
                        <td className="px-3 py-3">
                          <select
                            value={item.facadeType}
                            onChange={(e) => updateItem(item.id, 'facadeType', e.target.value)}
                            className="w-full px-2 py-1.5 bg-gray-900/50 border border-gray-600 rounded text-sm text-gray-200 focus:ring-2 focus:ring-gray-500 print:border-0 print:bg-transparent print:text-slate-900"
                          >
                            {FACADE_TYPES.map(f => (
                              <option key={f.name} value={f.name}>{f.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={item.thickness}
                            onChange={(e) => updateItem(item.id, 'thickness', e.target.value)}
                            className="w-full px-2 py-1.5 bg-gray-900/50 border border-gray-600 rounded text-sm text-center text-gray-200 focus:ring-2 focus:ring-gray-500 print:border-0 print:bg-transparent print:text-slate-900"
                          >
                            <option value="16">16мм</option>
                            <option value="19">19мм</option>
                            <option value="22">22мм</option>
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              value={item.height}
                              onChange={(e) => updateItem(item.id, 'height', parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1.5 bg-gray-900/50 border border-gray-600 rounded text-sm text-center text-gray-200 focus:ring-2 focus:ring-gray-500 print:border-0 print:bg-transparent print:text-slate-900"
                            />
                            <span className="text-gray-500">×</span>
                            <input
                              type="number"
                              value={item.width}
                              onChange={(e) => updateItem(item.id, 'width', parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1.5 bg-gray-900/50 border border-gray-600 rounded text-sm text-center text-gray-200 focus:ring-2 focus:ring-gray-500 print:border-0 print:bg-transparent print:text-slate-900"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.isMinAreaApplied 
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 print:bg-orange-50 print:text-orange-800' 
                              : 'bg-gray-700/50 text-gray-300 print:bg-slate-100 print:text-slate-800'
                          }`}>
                            {item.effectiveArea}
                            {item.isMinAreaApplied && <span className="ml-1">⚠</span>}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-14 px-2 py-1.5 bg-gray-900/50 border border-gray-600 rounded text-sm text-center font-medium text-gray-200 focus:ring-2 focus:ring-gray-500 print:border-0 print:bg-transparent print:text-slate-900"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={item.edge}
                            onChange={(e) => updateItem(item.id, 'edge', e.target.value)}
                            className="w-full px-2 py-1.5 bg-gray-900/50 border border-gray-600 rounded text-xs text-gray-200 focus:ring-2 focus:ring-gray-500 print:border-0 print:bg-transparent print:text-slate-900"
                          >
                            {EDGE_OPTIONS.map(e => (
                              <option key={e.name} value={e.name}>{e.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={item.gloss}
                            onChange={(e) => updateItem(item.id, 'gloss', e.target.value)}
                            className="w-full px-2 py-1.5 bg-gray-900/50 border border-gray-600 rounded text-xs text-gray-200 focus:ring-2 focus:ring-gray-500 print:border-0 print:bg-transparent print:text-slate-900"
                          >
                            {GLOSS_OPTIONS.map(g => (
                              <option key={g.name} value={g.name}>{g.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={item.backFinish}
                            onChange={(e) => updateItem(item.id, 'backFinish', e.target.value)}
                            className="w-full px-2 py-1.5 bg-gray-900/50 border border-gray-600 rounded text-xs text-gray-200 focus:ring-2 focus:ring-gray-500 print:border-0 print:bg-transparent print:text-slate-900"
                          >
                            {BACK_FINISH_OPTIONS.map(b => (
                              <option key={b.name} value={b.name}>{b.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={item.facadeStyle}
                            onChange={(e) => updateItem(item.id, 'facadeStyle', e.target.value)}
                            className="w-full px-2 py-1.5 bg-gray-900/50 border border-gray-600 rounded text-xs text-gray-200 focus:ring-2 focus:ring-gray-500 print:border-0 print:bg-transparent print:text-slate-900"
                          >
                            {FACADE_STYLE_OPTIONS.map(f => (
                              <option key={f.name} value={f.name}>{f.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-gray-100 print:text-slate-900">
                          {item.error ? (
                            <span className="text-red-400 text-xs print:text-red-600">{item.error}</span>
                          ) : (
                            `${item.lineTotal.toLocaleString()} ₽`
                          )}
                        </td>
                        <td className="px-3 py-3 text-center print:hidden">
                          <button
                            onClick={() => deleteRow(item.id)}
                            className="text-red-400 hover:text-red-300 text-lg font-bold transition-colors"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Print Totals */}
              <div className="hidden print:block px-6 py-4 border-t-2 border-slate-900">
                <div className="max-w-md ml-auto space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Товары:</span>
                    <span className="font-medium">{calculations.itemsSubtotal.toLocaleString()} ₽</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Упаковка:</span>
                    <span className="font-medium">{calculations.packagingCost.toLocaleString()} ₽</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Доставка:</span>
                    <span className="font-medium">{calculations.deliveryCost.toLocaleString()} ₽</span>
                  </div>
                  {calculations.globalFinishingCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Доп. отделка ({calculations.totalArea} м²):</span>
                      <span className="font-medium">{calculations.globalFinishingCost.toLocaleString()} ₽</span>
                    </div>
                  )}
                  <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-baseline">
                    <span className="text-lg font-bold">ИТОГО:</span>
                    <span className="text-2xl font-bold">{calculations.total.toLocaleString()} ₽</span>
                  </div>
                </div>
              </div>

              {/* Print Footer */}
              <div className="hidden print:block px-6 py-4 border-t border-slate-300 text-sm">
                <div className="grid grid-cols-2 gap-8 mt-8">
                  <div>
                    <p className="mb-2">Заказчик: ____________________</p>
                    <p className="text-xs text-gray-500">(подпись)</p>
                  </div>
                  <div>
                    <p className="mb-2">Исполнитель: ____________________</p>
                    <p className="text-xs text-gray-500">(подпись)</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-600 shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-100">Загрузить данные из файла</h2>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                isDragging 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-600 bg-gray-900/30 hover:border-gray-500'
              }`}
            >
              {ocrProgress ? (
                <div className="py-4">
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <svg className="w-16 h-16 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-500">{ocrProgress.progress}%</span>
                    </div>
                  </div>
                  <p className="text-blue-300 text-lg mb-2">
                    {ocrProgress.status === 'loading' ? 'Загрузка...' : 'Распознавание текста...'}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Это может занять 10-30 секунд
                  </p>
                </div>
              ) : (
                <>
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-300 text-lg mb-2">
                    Перетащите файл сюда
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    или
                  </p>
                  <label className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer transition-all">
                    Выбрать файл
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.json,.pdf,.jpg,.jpeg,.png,.bmp,.tiff,.webp"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleFileUpload(file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                </>
              )}
            </div>

            {/* File Format Info */}
            <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Поддерживаемые форматы:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">📷 <strong className="text-gray-300">Фото/Изображения</strong></p>
                  <p className="text-gray-500 text-xs">JPG, PNG, BMP, TIFF</p>
                  <p className="text-gray-500 text-xs mt-2">OCR распознавание:</p>
                  <ul className="text-gray-500 text-xs ml-4 mt-1">
                    <li>• Рукописный текст</li>
                    <li>• Печатный текст</li>
                    <li>• Размеры, количество</li>
                    <li>• Типы фасадов</li>
                  </ul>
                  <p className="text-amber-400 text-xs mt-2">⚠️ Требует хорошего освещения</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">📄 <strong className="text-gray-300">PDF</strong></p>
                  <p className="text-gray-500 text-xs">Текстовый PDF файл</p>
                  <p className="text-gray-500 text-xs mt-2">Распознает паттерны:</p>
                  <ul className="text-gray-500 text-xs ml-4 mt-1">
                    <li>• 716x396 или 716х396</li>
                    <li>• 716*396 или 716×396</li>
                    <li>• Контекстные пары чисел</li>
                    <li>• Высота/Ширина из текста</li>
                  </ul>
                  <p className="text-amber-400 text-xs mt-2">⚠️ Скан-PDF не поддерживается</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">📊 <strong className="text-gray-300">Excel/CSV</strong></p>
                  <p className="text-gray-500 text-xs">Файл должен содержать столбцы:</p>
                  <ul className="text-gray-500 text-xs ml-4 mt-1">
                    <li>• Высота (В, H, Height)</li>
                    <li>• Ширина (Ш, W, Width)</li>
                    <li>• Количество (опционально)</li>
                    <li>• Фасад/Тип (опционально)</li>
                    <li>• Толщина (опционально)</li>
                  </ul>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">💾 <strong className="text-gray-300">JSON</strong></p>
                  <p className="text-gray-500 text-xs">Ранее сохраненный заказ</p>
                  <p className="text-gray-500 text-xs mt-2">Автоматически восстановит:</p>
                  <ul className="text-gray-500 text-xs ml-4 mt-1">
                    <li>• Все позиции</li>
                    <li>• Информацию о заказе</li>
                    <li>• Настройки</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-xs">
                💡 <strong>Совет:</strong> Для изображений с рукописным текстом делайте четкие фото при хорошем освещении. 
                PDF и Excel дают наиболее точные результаты. Система автоматически распознает 
                размеры, количество и типы фасадов.
              </p>
            </div>
            <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-amber-300 text-xs">
                ⚠️ <strong>Важно:</strong> После загрузки фото с рукописным текстом ОБЯЗАТЕЛЬНО проверьте все данные вручную. 
                OCR может ошибаться при распознавании неразборчивого почерка.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { margin: 1.5cm; size: A4 landscape; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          input, select { 
            border: none !important; 
            background: transparent !important;
            -webkit-appearance: none;
          }
        }
      `}</style>
    </div>
  );
}
