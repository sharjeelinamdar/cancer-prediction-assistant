import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { KNOWLEDGE_ARTICLES, KNOWLEDGE_CATEGORIES } from "../lib/knowledgeArticles";

function getCategoryTone(category: string): string {
  if (category.includes("Breast")) return "border-pink-200 bg-pink-50 text-pink-700";
  if (category.includes("Lung")) return "border-sky-200 bg-sky-50 text-sky-700";
  if (category.includes("Prostate")) return "border-indigo-200 bg-indigo-50 text-indigo-700";
  if (category.includes("Prevention")) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-slate-300 bg-slate-100 text-slate-700";
}

export default function KnowledgeHubPage() {
  const navigate = useNavigate();
  const { articleId } = useParams();
  const [activeCategory, setActiveCategory] = useState<(typeof KNOWLEDGE_CATEGORIES)[number]>("All");

  const selectedArticle = useMemo(
    () => (articleId ? KNOWLEDGE_ARTICLES.find((item) => item.id === articleId) ?? null : null),
    [articleId]
  );

  const filteredArticles = useMemo(() => {
    if (activeCategory === "All") {
      return KNOWLEDGE_ARTICLES;
    }
    return KNOWLEDGE_ARTICLES.filter((article) => article.category === activeCategory);
  }, [activeCategory]);

  if (selectedArticle) {
    return (
      <section className="space-y-5">
        <div className="fade-in-up rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <button
            type="button"
            onClick={() => navigate("/knowledge")}
            className="mb-3 rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Back to Articles
          </button>

          <h1 className="text-2xl font-semibold text-slate-900">{selectedArticle.title}</h1>
          <p className="mt-2 text-sm text-slate-600">{selectedArticle.description}</p>

          <div className="mt-3 inline-flex rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {selectedArticle.category}
          </div>
        </div>

        <article className="fade-in-up rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <div className="space-y-4 text-sm leading-6 text-slate-700">
            <section>
              <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
              <p className="mt-1">{selectedArticle.overview}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">Symptoms</h2>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {selectedArticle.symptoms.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">Causes</h2>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {selectedArticle.causes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">Prevention</h2>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {selectedArticle.prevention.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/chat", {
                state: {
                  prefillMessage: `Explain this cancer-related article in simple language: ${selectedArticle.content}`,
                },
              })
            }
            className="mt-5 rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
          >
            Explain in simple terms
          </button>
        </article>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="fade-in-up rounded-2xl border border-indigo-200 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-6 text-center text-white shadow-sm">
        <h1 className="text-2xl font-semibold">Cancer Knowledge Hub</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-indigo-100">
          Learn about cancer types, early signs, prevention, and treatments with AI-assisted insights.
        </p>
      </div>

      <div className="fade-in-up rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {KNOWLEDGE_CATEGORIES.map((category) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={[
                  "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  active
                    ? "border-indigo-300 bg-indigo-100 text-indigo-800"
                    : "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200",
                ].join(" ")}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredArticles.map((article) => (
          <article
            key={article.id}
            className="fade-in-up rounded-2xl border border-slate-300 bg-white p-4 shadow-sm transition duration-200 hover:scale-[1.01] hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-sm font-bold text-slate-700">
                {article.title.charAt(0)}
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getCategoryTone(article.category)}`}>
                {article.category}
              </span>
            </div>

            <h2 className="text-base font-semibold text-slate-900">{article.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{article.description}</p>

            <Link
              to={`/knowledge/${article.id}`}
              className="mt-4 inline-flex rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-200"
            >
              Read More
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
