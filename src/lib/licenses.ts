export interface LicenseInfo {
  name: string;
  description: string;
  permissions: string[];
  conditions: string[];
  limitations: string[];
  url: string;
}

export const LICENSE_INFO: Record<string, LicenseInfo> = {
  "MIT": {
    name: "MIT License",
    description: "A permissive license that is short and to the point. It lets people do anything with your code with proper attribution and without warranty.",
    permissions: ["Commercial use", "Modification", "Distribution", "Private use"],
    conditions: ["License and copyright notice"],
    limitations: ["Liability", "Warranty"],
    url: "https://opensource.org/licenses/MIT"
  },
  "Apache-2.0": {
    name: "Apache License 2.0",
    description: "A permissive license that also provides an express grant of patent rights from contributors to users.",
    permissions: ["Commercial use", "Modification", "Distribution", "Patent use", "Private use"],
    conditions: ["License and copyright notice", "State changes"],
    limitations: ["Liability", "Trademark use", "Warranty"],
    url: "https://opensource.org/licenses/Apache-2.0"
  },
  "GPL-3.0": {
    name: "GNU General Public License v3.0",
    description: "A copyleft license that requires anyone who distributes your code or a derivative work to make the source available under the same terms.",
    permissions: ["Commercial use", "Modification", "Distribution", "Patent use", "Private use"],
    conditions: ["Disclose source", "License and copyright notice", "State changes", "Same license"],
    limitations: ["Liability", "Warranty"],
    url: "https://opensource.org/licenses/GPL-3.0"
  },
  "BSD-3-Clause": {
    name: "BSD 3-Clause License",
    description: "A permissive license similar to MIT but with a clause that prohibits use of contributor names for endorsement.",
    permissions: ["Commercial use", "Modification", "Distribution", "Private use"],
    conditions: ["License and copyright notice"],
    limitations: ["Liability", "Warranty", "Use for endorsement"],
    url: "https://opensource.org/licenses/BSD-3-Clause"
  },
  "BSD-2-Clause": {
    name: "BSD 2-Clause License",
    description: "A permissive license that comes in two variants: the BSD 2-Clause and BSD 3-Clause. Both have very simple requirements.",
    permissions: ["Commercial use", "Modification", "Distribution", "Private use"],
    conditions: ["License and copyright notice"],
    limitations: ["Liability", "Warranty"],
    url: "https://opensource.org/licenses/BSD-2-Clause"
  },
  "ISC": {
    name: "ISC License",
    description: "A permissive license that is functionally equivalent to MIT but with simpler language.",
    permissions: ["Commercial use", "Modification", "Distribution", "Private use"],
    conditions: ["License and copyright notice"],
    limitations: ["Liability", "Warranty"],
    url: "https://opensource.org/licenses/ISC"
  },
  "AGPL-3.0": {
    name: "GNU Affero General Public License v3.0",
    description: "A copyleft license similar to GPL-3.0 but requires source distribution for network use.",
    permissions: ["Commercial use", "Modification", "Distribution", "Patent use", "Private use"],
    conditions: ["Disclose source", "License and copyright notice", "Network use is distribution", "State changes", "Same license"],
    limitations: ["Liability", "Warranty"],
    url: "https://opensource.org/licenses/AGPL-3.0"
  },
  "LGPL-3.0": {
    name: "GNU Lesser General Public License v3.0",
    description: "A copyleft license that allows linking to non-LGPL code, unlike GPL.",
    permissions: ["Commercial use", "Modification", "Distribution", "Patent use", "Private use"],
    conditions: ["Disclose source", "License and copyright notice", "State changes", "Same license (library)"],
    limitations: ["Liability", "Warranty"],
    url: "https://opensource.org/licenses/LGPL-3.0"
  },
  "MPL-2.0": {
    name: "Mozilla Public License 2.0",
    description: "A weak copyleft license that allows combination with proprietary code.",
    permissions: ["Commercial use", "Modification", "Distribution", "Patent use", "Private use"],
    conditions: ["Disclose source", "License and copyright notice", "Same license (file)"],
    limitations: ["Liability", "Trademark use", "Warranty"],
    url: "https://opensource.org/licenses/MPL-2.0"
  },
  "Unlicense": {
    name: "The Unlicense",
    description: "A public domain dedication that allows anyone to do anything with your code.",
    permissions: ["Commercial use", "Modification", "Distribution", "Private use"],
    conditions: [],
    limitations: ["Liability", "Warranty"],
    url: "https://unlicense.org/"
  },
  "CC0-1.0": {
    name: "Creative Commons Zero v1.0 Universal",
    description: "A public domain dedication that waives all rights to your work.",
    permissions: ["Commercial use", "Modification", "Distribution", "Private use"],
    conditions: [],
    limitations: ["Liability", "Trademark use", "Patent use", "Warranty"],
    url: "https://creativecommons.org/publicdomain/zero/1.0/"
  }
};

export function getLicenseInfo(license: string | null | undefined): LicenseInfo | null {
  if (!license) return null;

  // Normalize license string (remove common variations)
  const normalized = license
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/LICENSE$/i, "")
    .trim();

  // Try exact match first
  if (LICENSE_INFO[license]) {
    return LICENSE_INFO[license];
  }

  // Try normalized match
  const match = Object.keys(LICENSE_INFO).find(key =>
    key.toUpperCase() === normalized ||
    key.toUpperCase().replace(/-/g, "") === normalized.replace(/-/g, "")
  );

  if (match) {
    return LICENSE_INFO[match];
  }

  // Return generic info for unknown licenses
  return {
    name: license,
    description: "License information not available.",
    permissions: [],
    conditions: [],
    limitations: [],
    url: ""
  };
}
