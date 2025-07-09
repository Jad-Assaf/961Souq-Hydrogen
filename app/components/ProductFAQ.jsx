import React, {useState} from 'react';

// src/components/ProductFAQ.jsx
const faqByProductType = {
  Laptops: [
    {
      question:
        'What is the difference between a gaming laptop and a business laptop?',
      answer: `
  Gaming laptops are engineered for graphics-intensive workloads and prioritize high-end GPUs, advanced cooling systems, and often higher-refresh-rate displays (120 Hz and above) to deliver smooth frame rates in the latest titles. They tend to be heavier and thicker to accommodate powerful components and thermal solutions. Business laptops (sometimes called ultrabooks or professional laptops), on the other hand, focus on portability, battery endurance, and reliability.<br>
   You’ll find slimmer profiles, longer-lasting batteries (8–12 hours of mixed use), spill-resistant keyboards, and enterprise-grade security features such as TPM chips, fingerprint scanners, and optional smart-card readers. While a gaming laptop trades mobility for performance, a business model trades peak frame rates and RGB lighting for lightweight build, quiet operation, and secure remote-management capabilities.`,
    },
    {
      question: 'How does the CPU affect specific tasks?',
      answer: `
  The CPU—your system’s “brain”—executes all general computing instructions. For everyday tasks like web browsing, email, and document editing, a quad-core processor with moderate clock speeds (2.0–3.0 GHz base) is more than sufficient. When you dive into more demanding workloads—such as compiling large codebases, running multiple virtual machines, data analysis, or video transcoding—a higher core/thread count (6–8 cores or more) and higher turbo frequencies make a marked difference. More cores allow the CPU to juggle parallel tasks simultaneously, reducing build times in development environments or speeding up batch-export jobs in creative applications. Faster single-core performance improves responsiveness, so look for CPUs with a strong combination of core count and per-core speed for the best all-around experience.`,
    },
    {
      question: 'Why is the GPU important for performance?',
      answer: `
  The GPU (graphics processing unit) is specialized for parallel compute and rendering tasks. In gaming, a dedicated GPU with its own high-speed VRAM delivers higher frame rates, better visual detail, and support for features like real-time ray tracing. Beyond gaming, GPUs accelerate workloads such as 3D modeling, CAD, video editing (effects and encoding), and even machine-learning inference. An integrated GPU (built into the CPU) shares system memory and is fine for basic video playback and office graphics, but it cannot match the throughput of a discrete GPU when it comes to processing large textures, complex shaders, or parallel data streams. If your workflow involves any form of hardware-accelerated rendering or compute, a dedicated GPU can slash render times and provide smoother previews in creative software.`,
    },
    {
      question: 'What role does RAM play?',
      answer: `
  RAM (random-access memory) serves as the CPU and GPU’s short-term workspace, storing active data and instructions. When you open applications, load files, or browse the web, those assets are cached in RAM. If you run out of RAM, your system resorts to slower storage (SSD or HDD), causing noticeable lag and stuttering. For light productivity—email, spreadsheets, light web multitasking—8 GB may suffice. For heavier multitasking (20+ browser tabs, virtual machines, large Photoshop files) or professional apps (video editing, 3D rendering), 16–32 GB is recommended. Furthermore, on systems with integrated graphics, faster RAM speeds (e.g., 3200 MHz vs. 2666 MHz) can meaningfully improve graphical performance because the GPU draws from system memory.`,
    },
    {
      question: 'What is the difference between HDD, SSD, and NVMe storage?',
      answer: `
      <ul>
        <li>HDD (Hard Disk Drive) uses spinning magnetic platters and a read/write head—it's affordable with high capacities but much slower (100–150 MB/s) and more prone to mechanical failure.</li>
        
        <li>SSD (Solid State Drive) uses NAND flash chips with a SATA interface, delivering 5–10× the speed of an HDD (up to ~550 MB/s), no moving parts for greater durability, and lower power draw.</li>
        
        <li>NVMe (Non-Volatile Memory Express) is a protocol over PCIe lanes, allowing SSDs to reach 2–7× the speed of SATA-SSDs (1,500–3,500 MB/s+).</li>
        </ul>
        NVMe drives offer the highest throughput and lowest latency, ideal for heavy workloads like video editing or large file transfers.
        `,
    },
    {
      question: 'How do screen sizes impact usability?',
      answer: `
  Laptop screens typically range from 13″ to 17″ diagonally, each offering different trade-offs. 
  <ul>
  <li>13″–14″: Highly portable and lightweight (sub-1.3 kg), ideal for frequent travelers and students, but less screen real estate for side-by-side windows.  </li>
  <li>15″: The most popular compromise, delivering a comfortable balance between productivity space and manageable weight (around 1.6–2.0 kg).  </li>
  <li>16″–17″: Suited for gaming, content creation, or detailed work, offering expansive workspace and often higher resolutions, but add bulk and reduce battery life due to larger backlights.  </li>
  </ul>
  Also consider resolution (Full HD, QHD, 4K), panel type (IPS for color accuracy, OLED for contrast), and refresh rate (60 Hz vs. 120/144 Hz+) based on your priorities.`,
    },
    {
      question: 'What warranty coverage applies?',
      answer: `
  Standard laptops include a one-year manufacturer warranty covering defects in materials and workmanship, effective from the delivery date. This warranty typically covers hardware failures not caused by user damage. Some models offer extended-warranty plans (two or three years), such extended warranties will always be stated in the top section of the product page. Warranty claims generally require a valid proof of purchase and the device’s serial number.`,
    },
    {
      question: 'Are VAT charges included in the price?',
      answer: `
  All displayed laptop prices include Value-Added Tax (VAT) by default, unless explicitly noted otherwise on the product page. Any additional fees—such as shipping, or handling will be clearly itemized during checkout. If a product is VAT-exempt, that exception will be stated alongside the price.`,
    },
  ],
};

export default function ProductFAQ({productType}) {
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = faqByProductType[productType] || [];
  if (!faqs.length) return null;

  const handleClick = (idx) => setOpenIndex(openIndex === idx ? null : idx);

  return (
    <section className="product-faq">
      <h2>Frequently Asked Questions</h2>
      <div className="faq-list">
        {faqs.map((item, idx) => (
          <div
            key={idx}
            className={`faq-item ${openIndex === idx ? 'open' : ''}`}
          >
            <h3 className="faq-question" onClick={() => handleClick(idx)}>
              {item.question}
            </h3>
            <div className="faq-answer-wrapper">
              <div
                className="faq-answer"
                dangerouslySetInnerHTML={{__html: item.answer}}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
