export const DEFAULT_RESUME_DATA = {
  full_name: 'ALEX MORGAN',
  contact_info: '+1 (555) 234-5678 | alex.morgan@email.com | linkedin.com/in/alex-morgan | San Francisco, CA',
  professional_summary: 'Results-driven Full-Stack & AI Software Engineer with 4+ years of experience designing scalable web architectures and high-performance cloud applications. Proven track record in orchestrating distributed microservices, building real-time data pipelines, and optimizing LLM-powered systems for production reliability.',
  technical_skills: 'Programming Languages: Python, TypeScript, JavaScript, Go, SQL\nFrontend & UI: React.js, Next.js, Tailwind CSS, Redux, WebSockets\nBackend & Cloud: Node.js, FastAPI, PostgreSQL, Redis, Docker, AWS (ECS, S3, Lambda), CI/CD\nAI & Machine Learning: PyTorch, Hugging Face, LangChain, RAG Architectures, Vector Databases',
  experience: [
    {
      company: 'CloudScale Technologies',
      location: 'San Francisco, CA',
      job_title: 'Full-Stack Software Engineer',
      date_range: '2022 – Present',
      description: 'Architected an event-driven data streaming pipeline processing 2M+ daily events using FastAPI, Kafka, and PostgreSQL, reducing latency by 45%.\nEngineered a real-time collaborative analytics dashboard with React and WebSockets, supporting 10,000+ concurrent enterprise users.\nLed migration of monolithic backend services to containerized Docker microservices deployed on AWS ECS with automated CI/CD.'
    },
    {
      company: 'Apex Labs',
      location: 'New York, NY',
      job_title: 'Software Engineering Intern',
      date_range: '2021 – 2022',
      description: 'Built customer-facing web modules using Next.js and Tailwind CSS, increasing page load speed by 35%.\nImplemented automated test suites and end-to-end integration workflows achieving 92% code coverage.'
    }
  ],
  projects: [
    {
      name: 'PulseAI — Intelligent Search Engine',
      tech_stack: 'Next.js 14 • Python • FastAPI • PostgreSQL • Pinecone • OpenAI',
      link: 'github.com/alexmorgan/pulse-ai',
      description: 'Engineered an AI-powered semantic search engine utilizing hybrid retrieval (BM25 + dense embeddings) and Groq LLaMA-3.\nOptimized vector similarity querying and implemented chunk-level semantic caching, reducing API overhead by 50%.'
    },
    {
      name: 'OmniFlow — Distributed Task Orchestrator',
      tech_stack: 'Go • React • Redis • Docker • gRPC',
      link: 'github.com/alexmorgan/omniflow',
      description: 'Designed a high-throughput job queue and workflow scheduler handling 500+ tasks/sec with fault-tolerant workers and state persistence in Redis.'
    }
  ],
  education: [
    {
      degree: 'B.S. in Computer Science',
      institution: 'University of California, Berkeley',
      date_range: '2018 – 2022',
      gpa: '3.85 / 4.0'
    }
  ],
  certifications: 'AWS Certified Solutions Architect – Associate (2024) · Deep Learning Specialization — DeepLearning.AI (2023)',
  achievements: 'First Place Winner at Global Cloud Hackathon (out of 350+ international engineering teams).\nPublished research on Efficient Transformer Inference at ACM International Conference on Intelligent Computing (2023).',
  target_job_description: ''
};
