(function () {
  var state = {
    companyKey: "adm",
    intervalDays: 14,
    loading: false,
    workflowMode: "unknown",
    backendAvailable: false,
    isFilePreview: window.location.protocol === "file:"
  };

  var runtimeConfig = window.CSIS_DASHBOARD_CONFIG || {};

  var companyData = {
    adm: {
      name: "ADM",
      domain: "adm.com",
      secCik: "7084"
    },
    bhp: {
      name: "BHP",
      domain: "bhp.com",
      secCik: "811809"
    },
    hyundai: {
      name: "Hyundai",
      domain: "hyundai.com",
      secCik: ""
    },
    samsung: {
      name: "Samsung",
      domain: "samsung.com",
      secCik: ""
    },
    chevron: {
      name: "Chevron",
      domain: "chevron.com",
      secCik: "93410"
    },
    cisco: {
      name: "Cisco",
      domain: "cisco.com",
      secCik: "858877"
    },
    merck: {
      name: "Merck",
      domain: "merck.com",
      secCik: "310158"
    },
    qualcomm: {
      name: "Qualcomm",
      domain: "qualcomm.com",
      secCik: "804328",
      aliases: [
        "Qualcomm Incorporated",
        "Qualcomm Technologies",
        "Snapdragon",
        "Qualcomm AI",
        "Qualcomm CDMA Technologies"
      ]
    },
    nvidia: {
      name: "NVIDIA",
      domain: "nvidia.com",
      secCik: "1045810"
    },
    microsoft: {
      name: "Microsoft",
      domain: "microsoft.com",
      secCik: "789019"
    },
    ibm: {
      name: "IBM",
      domain: "ibm.com",
      secCik: "51143"
    },
    exxon: {
      name: "Exxon",
      domain: "corporate.exxonmobil.com",
      secCik: "34088"
    },
    amazon: {
      name: "Amazon",
      domain: "amazon.com",
      secCik: "1018724"
    },
    bank_of_america: {
      name: "Bank of America",
      domain: "bankofamerica.com",
      secCik: "70858"
    },
    pepsico: {
      name: "PepsiCo",
      domain: "pepsico.com",
      secCik: "77476"
    },
    infineon: {
      name: "Infineon",
      domain: "infineon.com",
      secCik: ""
    },
    gilead: {
      name: "Gilead",
      domain: "gilead.com",
      secCik: "882095"
    },
    aramco: {
      name: "Aramco",
      domain: "aramco.com",
      secCik: ""
    },
    equinor: {
      name: "Equinor",
      domain: "equinor.com",
      secCik: "1140625"
    },
    sk_americas: {
      name: "SK Americas",
      domain: "sk.com",
      secCik: ""
    },
    jp_morgan: {
      name: "JP Morgan",
      domain: "jpmorganchase.com",
      secCik: "19617"
    },
    boeing: {
      name: "Boeing",
      domain: "boeing.com",
      secCik: "12927"
    },
    general_atomics: {
      name: "General Atomics",
      domain: "ga.com",
      secCik: ""
    },
    mitsubishi: {
      name: "Mitsubishi",
      domain: "mhi.com",
      secCik: "",
      aliases: ["Mitsubishi Heavy Industries", "MHI"]
    },
    sumitomo: {
      name: "Sumitomo",
      domain: "sumitomo.com",
      secCik: ""
    }
  };

  var companyOptions = document.getElementById("company-options");
  var daySlider = document.getElementById("day-slider");
  var dayValue = document.getElementById("day-value");
  var generateButton = document.getElementById("generate-button");
  var statusBox = document.getElementById("status-box");
  var loadingPanel = document.getElementById("loading-panel");
  var progressFill = document.getElementById("progress-fill");
  var progressPercent = document.getElementById("progress-percent");
  var progressStage = document.getElementById("progress-stage");
  var resultsPanel = document.getElementById("results-panel");
  var modeChip = document.getElementById("mode-chip");
  var memoTitle = document.getElementById("memo-title");
  var memoBody = document.getElementById("memo-body");
  var runMeta = document.getElementById("run-meta");
  var sourcesList = document.getElementById("sources-list");
  var fileChip = document.getElementById("file-chip");
  var progressTimer = null;
  var allowedIntervals = [14, 30, 60];

  function sliderPositionFromDays(days) {
    var index = allowedIntervals.indexOf(days);
    return index === -1 ? 0 : index;
  }

  function sliderPercent() {
    var min = Number(daySlider.min || 0);
    var max = Number(daySlider.max || (allowedIntervals.length - 1));
    return ((sliderPositionFromDays(state.intervalDays) - min) / (max - min)) * 100;
  }

  function renderDaySelector() {
    if (!daySlider || !dayValue) return;
    daySlider.value = String(sliderPositionFromDays(state.intervalDays));
    dayValue.textContent = state.intervalDays + " days";
    daySlider.style.background =
      "linear-gradient(90deg, rgba(215, 181, 109, 0.88) 0%, rgba(215, 181, 109, 0.88) " +
      sliderPercent() +
      "%, rgba(255, 255, 255, 0.15) " +
      sliderPercent() +
      "%, rgba(255, 255, 255, 0.15) 100%)";
  }

  function setStatus(message) {
    statusBox.textContent = message;
  }

  function progressStageLabel(percent) {
    if (percent < 18) return "Submitting request";
    if (percent < 44) return "Collecting source universe";
    if (percent < 68) return "Validating documents";
    if (percent < 88) return "Drafting memo";
    return "Finalizing memo and sources";
  }

  function setProgress(percent) {
    var bounded = Math.max(8, Math.min(100, Math.round(percent)));
    progressFill.style.width = bounded + "%";
    progressPercent.textContent = bounded + "%";
    progressStage.textContent = progressStageLabel(bounded);
  }

  function stopProgressSimulation() {
    if (progressTimer) {
      window.clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function startProgressSimulation() {
    var checkpoints = [
      { elapsed: 0, percent: 8 },
      { elapsed: 3500, percent: 18 },
      { elapsed: 15000, percent: 40 },
      { elapsed: 32000, percent: 64 },
      { elapsed: 54000, percent: 82 },
      { elapsed: 85000, percent: 93 }
    ];
    var startedAt = Date.now();

    stopProgressSimulation();
    setProgress(8);

    progressTimer = window.setInterval(function () {
      var elapsed = Date.now() - startedAt;
      var current = checkpoints[0];
      var next = checkpoints[checkpoints.length - 1];

      checkpoints.forEach(function (point, index) {
        if (elapsed >= point.elapsed) {
          current = point;
          next = checkpoints[Math.min(index + 1, checkpoints.length - 1)];
        }
      });

      if (current === next) {
        setProgress(current.percent);
        return;
      }

      var span = next.elapsed - current.elapsed;
      var ratio = span > 0 ? (elapsed - current.elapsed) / span : 1;
      setProgress(current.percent + (next.percent - current.percent) * ratio);
    }, 420);
  }

  function setLoading(isLoading) {
    state.loading = isLoading;
    generateButton.disabled = isLoading;
    generateButton.textContent = isLoading ? "Running..." : "Run Workflow";
    loadingPanel.hidden = !isLoading;
    if (isLoading) {
      resultsPanel.hidden = true;
      startProgressSimulation();
      return;
    }
    stopProgressSimulation();
    setProgress(8);
  }

  function setActiveButton(container, attributeName, value) {
    Array.prototype.forEach.call(container.querySelectorAll(".pill"), function (button) {
      var isActive = button.getAttribute(attributeName) === String(value);
      button.classList.toggle("active", isActive);
    });
  }

  function renderCompanyOptions() {
    companyOptions.innerHTML = "";
    Object.keys(companyData)
      .sort(function (left, right) {
        return companyData[left].name.localeCompare(companyData[right].name);
      })
      .forEach(function (companyKey) {
        var button = document.createElement("button");
        button.className = "pill";
        button.setAttribute("data-company", companyKey);
        button.textContent = companyData[companyKey].name;
        if (companyKey === state.companyKey) {
          button.classList.add("active");
        }
        companyOptions.appendChild(button);
      });
  }

  function formatDate(dateString) {
    if (!dateString) return "Unknown date";
    var date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleString();
  }

  function formatConfidence(value) {
    if (typeof value !== "number") return "";
    return "Confidence " + Math.round(value * 100) + "%";
  }

  function currentMainWebsite() {
    var company = companyData[state.companyKey] || {};
    return company.domain || "";
  }

  function isoDateOffset(daysAgo) {
    var date = new Date();
    date.setUTCDate(date.getUTCDate() - daysAgo);
    return date.toISOString().slice(0, 10);
  }

  function buildPreviewMemo(company, intervalDays) {
    return [
      "**Actionable Insights**",
      "1. " +
        company.name +
        " shows a " +
        intervalDays +
        "-day pattern of investor communication and policy-sensitive positioning. CSIS can connect these signals to industrial strategy, supply-chain resilience, and geopolitical risk. Relevant scholars include Jane Smith and Alex Rivera. Sources include [Company update](https://" +
        company.domain +
        ").",
      "2. A focused briefing could help translate regulatory and market changes into implications for long-cycle planning. The discussion should concentrate on the strongest supported issue rather than a generic corporate overview. Relevant CSIS material includes [Strategic policy analysis](https://www.csis.org/).",
      "**Recent Developments**",
      "- " +
        company.name +
        " published a new corporate update during the selected period. ([Company website](https://" +
        company.domain +
        "))",
      "- Public filings and policy notices created additional regulatory watchpoints. ([U.S. SEC](https://www.sec.gov/))",
      "**Past CSIS Engagements**",
      "- No matching past CSIS engagement record was found in the spreadsheet."
    ].join("\n\n");
  }

  function buildPreviewSources(companyKey, intervalDays) {
    var sourceSets = {
      chevron: [
        ["Chevron investor relations update", "https://www.chevron.com/investors", "chevron.com", "official", 7],
        ["Recent SEC filing for Chevron Corporation", "https://www.sec.gov/", "sec.gov", "official", 10],
        ["Federal Register energy policy notice", "https://www.federalregister.gov/", "federalregister.gov", "government", 11],
        ["CSIS analysis on energy security and market resilience", "https://www.csis.org/", "csis.org", "thinktank", 12],
        ["Major press coverage of Chevron market positioning", "https://www.reuters.com/", "reuters.com", "news", 5]
      ],
      exxon: [
        ["ExxonMobil corporate update", "https://corporate.exxonmobil.com/news", "corporate.exxonmobil.com", "official", 6],
        ["Recent SEC filing for Exxon Mobil Corporation", "https://www.sec.gov/", "sec.gov", "official", 11],
        ["OpenSecrets profile related to lobbying activity", "https://www.opensecrets.org/", "opensecrets.org", "government", 13],
        ["Think tank commentary on energy industrial strategy", "https://www.brookings.edu/", "brookings.edu", "thinktank", 15],
        ["Major press coverage of ExxonMobil operations", "https://www.wsj.com/", "wsj.com", "news", 9]
      ]
    };

    if (!sourceSets[companyKey]) {
      var company = companyData[companyKey];
      sourceSets[companyKey] = [
        [company.name + " official update", "https://" + company.domain, company.domain, "official", 6],
        [company.name + " SEC company filings", "https://www.sec.gov/", "sec.gov", "official", 10],
        [company.name + " policy and government signal", "https://www.federalregister.gov/", "federalregister.gov", "government", 13],
        [company.name + " strategic policy analysis", "https://www.csis.org/", "csis.org", "thinktank", 16],
        [company.name + " market and geopolitical coverage", "https://www.reuters.com/", "reuters.com", "news", 8]
      ];
    }

    return sourceSets[companyKey].map(function (source, index) {
      return {
        id: companyKey + "-preview-" + (index + 1),
        title: source[0],
        url: source[1],
        domain: source[2],
        sourceClass: source[3],
        publishedDate: isoDateOffset(Math.min(intervalDays - 1, source[4])),
        validationStatus: "accepted",
        entityConfidence: 0.84 + index * 0.03
      };
    });
  }

  function buildPreviewResult(companyKey, intervalDays) {
    var company = companyData[companyKey];
    var generatedAt = new Date().toISOString();

    return new Promise(function (resolve) {
      window.setTimeout(function () {
        resolve({
          ok: true,
          mode: "file preview",
          runId:
            companyKey +
            "_" +
            generatedAt.slice(0, 10) +
            "_" +
            intervalDays +
            "d_preview",
          generatedAt: generatedAt,
          company: company.name,
          intervalDays: intervalDays,
          memo: buildPreviewMemo(company, intervalDays),
          sources: buildPreviewSources(companyKey, intervalDays),
          excelFileName:
            company.name +
            "_validated_documents_" +
            generatedAt.slice(0, 10) +
            ".xlsx"
        });
      }, 650);
    });
  }

  function hasDirectN8nWebhook() {
  return Boolean(
    runtimeConfig.n8nStartWebhookUrl &&
      runtimeConfig.n8nStartWebhookUrl.trim() &&
      runtimeConfig.n8nStatusWebhookUrl &&
      runtimeConfig.n8nStatusWebhookUrl.trim()
  );
}

  function canUseBackendApi() {
    return !state.isFilePreview && state.backendAvailable;
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function normalizeWebhookPayload(payload) {
    if (Array.isArray(payload)) {
      payload = payload[0] || {};
    }

    var sources = Array.isArray(payload.validated_sources)
      ? payload.validated_sources
      : Array.isArray(payload.sources)
        ? payload.sources
        : [];
    var memo =
      payload.memo ||
      payload.final_one_pager ||
      [
        payload.recent_developments_paragraph,
        payload.past_csis_engagement_paragraph,
        payload.csis_convergence_paragraph,
        payload.email_pitch_ideas
      ]
        .filter(Boolean)
        .join("\n\n");

    return {
      ok: true,
      mode: "direct n8n webhook",
      runId: payload.runId || payload.run_id || "",
      generatedAt:
        payload.generatedAt || payload.generated_at || new Date().toISOString(),
      company: companyData[state.companyKey].name,
      intervalDays: state.intervalDays,
      memo: memo || "n8n returned no memo text.",
      sources: sources.map(function (source, index) {
        return {
          id: source.id || "source-" + (index + 1),
          title: source.title || "Untitled source",
          url: source.url || "",
          domain: source.domain || source.source_domain || "",
          sourceClass: source.sourceClass || source.source_class || "source",
          publishedDate:
            source.publishedDate ||
            source.published_date ||
            source.actual_doc_date ||
            "",
          validationStatus:
            source.validationStatus || source.validation_status || "accepted",
          entityConfidence:
            typeof source.entityConfidence === "number"
              ? source.entityConfidence
              : typeof source.entity_confidence === "number"
                ? source.entity_confidence
        : null
        };
      }),
      excelFileName: payload.excelFileName || payload.excel_file_name || ""
    };
  }

async function runDirectN8nWebhook() {
  var company = companyData[state.companyKey];
  var headers = {
    "Content-Type": "application/json"
  };

  if (runtimeConfig.n8nAuthHeader && runtimeConfig.n8nAuthValue) {
    headers[runtimeConfig.n8nAuthHeader] = runtimeConfig.n8nAuthValue;
  }

  var payloadBody = JSON.stringify({
    company_name: company.name,
    company_domain: company.domain,
    sec_cik: company.secCik,
    company_aliases: company.aliases || [],
    time_period_days: state.intervalDays,
    time_period_label: state.intervalDays + " days"
  });

  var startUrl = runtimeConfig.n8nStartWebhookUrl.trim();
  var statusUrl = runtimeConfig.n8nStatusWebhookUrl.trim();

  setStatus("Starting " + company.name + " memo job...");

  var startResponse = await fetch(startUrl, {
    method: "POST",
    headers: headers,
    body: payloadBody
  });

  var startPayload;
  try {
    startPayload = await startResponse.json();
  } catch (error) {
    throw new Error("The start workflow responded, but not with valid JSON.");
  }

  if (!startResponse.ok || !startPayload.job_id) {
    throw new Error(
      startPayload.error ||
        startPayload.error_message ||
        "Start workflow did not return a job_id."
    );
  }

  var jobId = startPayload.job_id;
  setStatus("Workflow started. Tracking job " + jobId + ". Waiting for completion...");

  var maxAttempts = runtimeConfig.n8nStatusMaxAttempts || 120;
  var pollDelayMs = runtimeConfig.n8nStatusPollDelayMs || 5000;

  for (var attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await delay(pollDelayMs);

    var separator = statusUrl.indexOf("?") === -1 ? "?" : "&";
    var statusResponse = await fetch(
      statusUrl + separator + "job_id=" + encodeURIComponent(jobId),
      {
        method: "GET"
      }
    );

    var statusPayload;
    try {
      statusPayload = await statusResponse.json();
    } catch (error) {
      throw new Error("The status workflow responded, but not with valid JSON.");
    }

    if (!statusResponse.ok) {
      throw new Error(
        statusPayload.error ||
          statusPayload.error_message ||
          "Status workflow returned HTTP " + statusResponse.status + "."
      );
    }

    var status = String(statusPayload.status || "").toLowerCase();

    if (status === "complete" || status === "completed") {
      return normalizeWebhookPayload({
        ok: true,
        run_id: statusPayload.job_id || jobId,
        generated_at: statusPayload.updated_at || new Date().toISOString(),
        final_one_pager: statusPayload.result_text || "",
        validated_sources: statusPayload.validated_sources || [],
        excel_file_name: statusPayload.result_url || ""
      });
    }

    if (status === "error" || status === "failed") {
      throw new Error(statusPayload.error_message || "The n8n workflow failed.");
    }

    setStatus(
      "Workflow still running. Tracking job " +
        jobId +
        ". Status check " +
        attempt +
        " of " +
        maxAttempts +
        "."
    );
  }

  throw new Error("Timed out waiting for the workflow to finish. Check n8n executions and the jobs sheet.");
}

  function readableLinkName(label, url, useSourceName) {
    if (!useSourceName) return label;

    var host = "";
    try {
      host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    } catch (error) {
      return label;
    }

    var sourceNames = {
      "amazon.com": "Amazon",
      "aboutamazon.com": "About Amazon",
      "reuters.com": "Reuters",
      "finance.yahoo.com": "Yahoo Finance",
      "seekingalpha.com": "Seeking Alpha",
      "fool.com": "The Motley Fool",
      "sec.gov": "U.S. SEC",
      "federalregister.gov": "Federal Register",
      "businesswire.com": "Business Wire",
      "prnewswire.com": "PR Newswire",
      "globenewswire.com": "GlobeNewswire",
      "bloomberg.com": "Bloomberg",
      "apnews.com": "AP News",
      "ft.com": "Financial Times",
      "wsj.com": "The Wall Street Journal",
      "cnbc.com": "CNBC",
      "csis.org": "CSIS"
    };
    var exactName = sourceNames[host];
    if (exactName) return exactName;

    var matchedDomain = Object.keys(sourceNames).find(function (domain) {
      return host.endsWith("." + domain);
    });
    if (matchedDomain) return sourceNames[matchedDomain];

    return label.length > 54 ? host : label;
  }

  function appendFormattedText(parent, text, useSourceNames) {
    var inlinePattern = /(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*)/g;
    var lastIndex = 0;
    var match;

    while ((match = inlinePattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parent.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      if (match[2] && match[3]) {
        var link = document.createElement("a");
        link.href = match[3];
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = readableLinkName(match[2], match[3], useSourceNames);
        parent.appendChild(link);
      } else if (match[4]) {
        var strong = document.createElement("strong");
        appendFormattedText(strong, match[4], useSourceNames);
        parent.appendChild(strong);
      }

      lastIndex = inlinePattern.lastIndex;
    }

    if (lastIndex < text.length) {
      parent.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
  }

  function hasInlineCitations(text) {
    return /\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/.test(text || "");
  }

  function memoSectionTitle(line) {
    var raw = String(line || "").trim();
    if (!raw) return "";

    var cleaned = raw
      .replace(/^\*\*(.+)\*\*$/, "$1")
      .replace(/^__(.+)__$/, "$1")
      .replace(/^#{1,6}\s*/, "")
      .replace(/^\d+[.)]\s*/, "")
      .replace(/(?:\s*\[\d+\])+\s*$/, "")
      .replace(/\s*:\s*$/, "")
      .trim();
    var normalized = cleaned.toLowerCase().replace(/\s+/g, " ");

    if (normalized === "actionable insights") return "Actionable Insights";
    if (normalized === "recent developments") return "Recent Developments";
    if (
      normalized === "past csis engagement" ||
      normalized === "past csis engagements"
    ) {
      return "Past CSIS Engagements";
    }

    return "";
  }

  function parseMemoSections(memo) {
    var lines = String(memo || "").split(/\r?\n/);
    var sections = [];
    var current = null;

    lines.forEach(function (line) {
      var heading = memoSectionTitle(line);

      if (heading) {
        if (current) sections.push(current);
        current = {
          title: heading,
          lines: []
        };
        return;
      }

      if (!current) {
        current = {
          title: "Memo",
          lines: []
        };
      }
      current.lines.push(line);
    });

    if (current) sections.push(current);
    return sections
      .map(function (section) {
        return {
          title: section.title,
          body: section.lines.join("\n").trim()
        };
      })
      .filter(function (section) {
        return section.body;
      });
  }

  function listMarker(line) {
    var unordered = String(line || "").match(/^\s*[-*]\s+(.+)$/);
    if (unordered) {
      return { type: "unordered", text: unordered[1], number: null };
    }

    var ordered = String(line || "").match(/^\s*(\d+)[.)]\s+(.+)$/);
    if (ordered) {
      return {
        type: "ordered",
        text: ordered[2],
        number: Number(ordered[1])
      };
    }

    return null;
  }

  function parseSectionBlocks(body) {
    var lines = String(body || "").split(/\r?\n/);
    var blocks = [];
    var index = 0;

    while (index < lines.length) {
      while (index < lines.length && !lines[index].trim()) index += 1;
      if (index >= lines.length) break;

      var marker = listMarker(lines[index]);
      if (marker) {
        var listType = marker.type;
        var startNumber = marker.number;
        var items = [];

        while (index < lines.length) {
          marker = listMarker(lines[index]);
          if (!marker || marker.type !== listType) break;

          var itemText = marker.text.trim();
          index += 1;

          while (
            index < lines.length &&
            lines[index].trim() &&
            !listMarker(lines[index])
          ) {
            itemText += " " + lines[index].trim();
            index += 1;
          }

          items.push(itemText);

          var nextContent = index;
          while (nextContent < lines.length && !lines[nextContent].trim()) {
            nextContent += 1;
          }
          var nextMarker = listMarker(lines[nextContent]);
          if (nextMarker && nextMarker.type === listType) {
            index = nextContent;
          } else {
            index = nextContent;
            break;
          }
        }

        blocks.push({
          type: listType,
          start: startNumber,
          items: items
        });
        continue;
      }

      var paragraphLines = [];
      while (
        index < lines.length &&
        lines[index].trim() &&
        !listMarker(lines[index])
      ) {
        paragraphLines.push(lines[index].trim());
        index += 1;
      }

      if (paragraphLines.length) {
        blocks.push({
          type: "paragraph",
          text: paragraphLines.join(" ")
        });
      }
    }

    return blocks;
  }

  function normalizeMemoParagraph(title, text) {
    // Keep the workflow's final wording intact. In particular, Past CSIS
    // Engagements is copied directly from the spreadsheet and must not be
    // rewritten by the webpage.
    var normalized = String(text || "").trim();

    // Some model outputs wrap a complete insight in bold Markdown. That makes
    // an entire paragraph visually heavy and prevents nested links from being
    // rendered cleanly, so only remove bold when it wraps the whole block.
    if (/^\*\*[\s\S]+\*\*$/.test(normalized)) {
      normalized = normalized.slice(2, -2).trim();
    }

    return normalized;
  }

  function appendMemoItemText(parent, text) {
    var sourceStart = text.search(/\s+Sources include\s+/i);
    if (sourceStart === -1) {
      appendFormattedText(parent, text, false);
      return;
    }

    appendFormattedText(parent, text.slice(0, sourceStart).trim(), false);

    var sourceLine = document.createElement("span");
    sourceLine.className = "memo-item-sources";
    var sourceText = text.slice(sourceStart).trim().replace(/^Sources include\s+/i, "");
    sourceLine.appendChild(document.createTextNode("Sources  "));
    appendFormattedText(sourceLine, sourceText, true);
    parent.appendChild(sourceLine);
  }

  function sectionSources(title, sources) {
    var lowerTitle = title.toLowerCase();
    var filtered = sources || [];

    if (lowerTitle.indexOf("past") !== -1) {
      return [];
    }

    if (lowerTitle.indexOf("why") !== -1 || lowerTitle.indexOf("csis") !== -1) {
      filtered = filtered.filter(function (source) {
        return (
          source.sourceClass === "thinktank" ||
          source.domain === "csis.org" ||
          String(source.domain || "").indexOf("csis.org") !== -1
        );
      });
    } else if (lowerTitle.indexOf("recent") !== -1) {
      filtered = filtered.filter(function (source) {
        return source.sourceClass !== "thinktank";
      });
    }

    if (!filtered.length) {
      filtered = sources || [];
    }

    return filtered
      .filter(function (source) {
        return source.url;
      })
      .slice(0, 4);
  }

  function appendSourceLinks(parent, citations) {
    if (!citations.length) return;

    var citationWrap = document.createElement("p");
    citationWrap.className = "memo-source-links";
    citationWrap.appendChild(document.createTextNode("Sources: "));

    citations.forEach(function (source, index) {
      if (index > 0) citationWrap.appendChild(document.createTextNode(" · "));
      var link = document.createElement("a");
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = source.title || source.domain || "Source";
      link.title = source.title || source.domain || "Source";
      citationWrap.appendChild(link);
    });

    parent.appendChild(citationWrap);
  }

  function renderMemo(memo, sources) {
    memoBody.innerHTML = "";

    parseMemoSections(memo).forEach(function (section) {
      var sectionEl = document.createElement("section");
      sectionEl.className = "memo-section";

      var title = document.createElement("h3");
      title.textContent = section.title;
      sectionEl.appendChild(title);

      var blocks = parseSectionBlocks(section.body);
      var isActionable = section.title === "Actionable Insights";
      var hasOrderedInsights = blocks.some(function (block) {
        return block.type === "ordered";
      });

      if (isActionable && !hasOrderedInsights) {
        var insightParagraphs = blocks.filter(function (block) {
          return block.type === "paragraph";
        });
        if (insightParagraphs.length) {
          var insightList = document.createElement("ol");
          insightParagraphs.forEach(function (block) {
            var insightItem = document.createElement("li");
            appendMemoItemText(
              insightItem,
              normalizeMemoParagraph(section.title, block.text.trim())
            );
            insightList.appendChild(insightItem);
          });
          sectionEl.appendChild(insightList);
          blocks = blocks.filter(function (block) {
            return block.type !== "paragraph";
          });
        }
      }

      blocks.forEach(function (block) {
        if (block.type === "paragraph") {
          var p = document.createElement("p");
          appendMemoItemText(
            p,
            normalizeMemoParagraph(section.title, block.text.trim())
          );
          sectionEl.appendChild(p);
          return;
        }

        var list = document.createElement(
          block.type === "ordered" ? "ol" : "ul"
        );
        if (block.type === "ordered" && block.start && block.start !== 1) {
          list.start = block.start;
        }
        block.items.forEach(function (itemText) {
          var item = document.createElement("li");
          appendMemoItemText(
            item,
            normalizeMemoParagraph(section.title, itemText.trim())
          );
          list.appendChild(item);
        });
        sectionEl.appendChild(list);
      });

      if (!hasInlineCitations(section.body)) {
        appendSourceLinks(sectionEl, sectionSources(section.title, sources));
      }

      memoBody.appendChild(sectionEl);
    });
  }

  function readableSourceClass(sourceClass) {
    return String(sourceClass || "source").replace(/_/g, " ");
  }

  function renderSources(sources) {
    sourcesList.innerHTML = "";

    if (!sources.length) {
      var empty = document.createElement("div");
      empty.className = "source-item";
      empty.textContent = "No validated sources were returned by the workflow.";
      sourcesList.appendChild(empty);
      return;
    }

    sources.forEach(function (source) {
      var item = document.createElement("article");
      item.className = "source-item";

      var top = document.createElement("div");
      top.className = "source-topline";

      var title = document.createElement("h4");
      title.className = "source-title";

      var link = document.createElement("a");
      link.href = source.url || "#";
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = source.title || "Untitled source";
      title.appendChild(link);

      var tagRow = document.createElement("div");
      tagRow.className = "tag-row";

      var sourceTag = document.createElement("span");
      sourceTag.className = "tag source";
      sourceTag.textContent = readableSourceClass(source.sourceClass);
      tagRow.appendChild(sourceTag);

      top.appendChild(title);
      top.appendChild(tagRow);

      var meta = document.createElement("div");
      meta.className = "source-meta";
      var mainWebsite = source.domain || currentMainWebsite();
      meta.textContent = [
        "Main website: " + mainWebsite,
        source.publishedDate ? "Published: " + source.publishedDate : ""
      ]
        .filter(Boolean)
        .join(" | ");

      item.appendChild(top);
      item.appendChild(meta);
      sourcesList.appendChild(item);
    });
  }

  function renderResult(result) {
    resultsPanel.hidden = false;
    memoTitle.textContent = result.company + " | " + result.intervalDays + "-day memo";
    runMeta.innerHTML =
      "Run ID: " +
      (result.runId || "n/a") +
      "<br />Generated: " +
      formatDate(result.generatedAt);
    fileChip.textContent = result.excelFileName
      ? "Validated file: " + result.excelFileName
      : "Validated sources displayed below";
    renderMemo(result.memo, result.sources || []);
    renderSources(result.sources || []);
  }

  async function loadHealth() {
    modeChip.hidden = true;

    if (state.isFilePreview) {
      state.backendAvailable = false;
      if (hasDirectN8nWebhook()) {
        state.workflowMode = "direct n8n webhook";
        setStatus("Ready to generate a memo.");
        return;
      }
      state.workflowMode = "file preview";
      setStatus("Preview is available. Add a webhook URL in public/config.js for live runs.");
      return;
    }

    try {
      var response = await fetch("/api/health");
      var payload = await response.json();
      state.backendAvailable = true;
      state.workflowMode = payload.workflowMode || "unknown";
      if (state.workflowMode === "webhook" && !payload.n8nConfigured) {
        setStatus(
          "Backend is in webhook mode, but N8N_WEBHOOK_URL is missing. Add it to .env and restart the server."
        );
      } else {
        setStatus("Ready to generate a memo.");
      }
    } catch (error) {
      state.backendAvailable = false;
      if (hasDirectN8nWebhook()) {
        state.workflowMode = "direct n8n webhook";
        setStatus("Ready to generate a memo.");
        return;
      }
      setStatus(
        "Backend unavailable. Run `node server.js` and open http://127.0.0.1:3000, or open this file directly for preview mode."
      );
    }
  }

  async function runReport() {
    if (canUseBackendApi()) {
      var response = await fetch("/api/run-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          companyKey: state.companyKey,
          intervalDays: state.intervalDays
        })
      });

      var payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to complete workflow run.");
      }

      return payload;
    }

    if (hasDirectN8nWebhook()) {
      return runDirectN8nWebhook();
    }

    if (state.isFilePreview) {
      return buildPreviewResult(state.companyKey, state.intervalDays);
    }

    throw new Error(
      "No live workflow route is configured. Start the backend proxy or set an n8n webhook URL in public/config.js."
    );
  }

  companyOptions.addEventListener("click", function (event) {
    var button = event.target.closest("[data-company]");
    if (!button || state.loading) return;
    state.companyKey = button.getAttribute("data-company");
    setActiveButton(companyOptions, "data-company", state.companyKey);
  });

  daySlider.addEventListener("input", function (event) {
    if (state.loading) return;
    state.intervalDays = allowedIntervals[Number(event.target.value)] || allowedIntervals[0];
    renderDaySelector();
  });

  generateButton.addEventListener("click", async function () {
    var company = companyData[state.companyKey];
    setLoading(true);
    setStatus(
      "Submitting " +
        company.name +
        " for a " +
        state.intervalDays +
        "-day run. Starting async workflow and polling for completion."
    );

    try {
      var payload = await runReport();
      renderResult(payload);
      setStatus(
        "Completed " +
          payload.company +
          " for the last " +
          payload.intervalDays +
          " days. Review the memo and validated sources on the right."
      );
    } catch (error) {
      setStatus(error.message || "Workflow failed.");
    } finally {
      setLoading(false);
    }
  });

  renderCompanyOptions();
  renderDaySelector();

  loadHealth().then(function () {
    var search = new URLSearchParams(window.location.search);
    if (search.get("autorun") === "1") {
      generateButton.click();
    }
  });
})();
