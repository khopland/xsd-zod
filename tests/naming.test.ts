import { describe, it, expect } from "vitest";
import {
  applyNaming,
  getTypeName,
  getSchemaName,
} from "../src/generators/naming";

describe("Naming Convention Utilities", () => {
  describe("applyNaming", () => {
    it("should convert to camelCase", () => {
      expect(applyNaming("first_name", "camel")).toBe("firstName");
      expect(applyNaming("FirstName", "camel")).toBe("firstName");
      expect(applyNaming("first-name", "camel")).toBe("firstName");
      expect(applyNaming("FIRST_NAME", "camel")).toBe("firstName");
    });

    it("should convert to pascalCase", () => {
      expect(applyNaming("first_name", "pascal")).toBe("FirstName");
      expect(applyNaming("firstName", "pascal")).toBe("FirstName");
      expect(applyNaming("first-name", "pascal")).toBe("FirstName");
      expect(applyNaming("FIRST_NAME", "pascal")).toBe("FirstName");
    });

    it("should convert to kebabCase", () => {
      expect(applyNaming("firstName", "kebab")).toBe("first-name");
      expect(applyNaming("FirstName", "kebab")).toBe("first-name");
      expect(applyNaming("first_name", "kebab")).toBe("first-name");
      expect(applyNaming("FIRST_NAME", "kebab")).toBe("first-name");
    });

    it("should keep original names", () => {
      expect(applyNaming("first_name", "original")).toBe("first_name");
      expect(applyNaming("firstName", "original")).toBe("firstName");
      expect(applyNaming("first-name", "original")).toBe("first-name");
    });

    it("should handle single word", () => {
      expect(applyNaming("name", "camel")).toBe("name");
      expect(applyNaming("name", "pascal")).toBe("Name");
      expect(applyNaming("name", "kebab")).toBe("name");
    });

    it("should handle empty string", () => {
      expect(applyNaming("", "camel")).toBe("");
      expect(applyNaming("", "pascal")).toBe("");
      expect(applyNaming("", "original")).toBe("");
    });

    it("should handle special characters", () => {
      expect(applyNaming("first_name_123", "camel")).toBe("firstName_123");
      expect(applyNaming("user@id", "camel")).toBe("userId");
    });
  });

  describe("getTypeName", () => {
    it("should use pascalCase for camel naming", () => {
      expect(getTypeName("user_profile", "camel")).toBe("UserProfile");
      expect(getTypeName("UserProfile", "camel")).toBe("UserProfile");
      expect(getTypeName("user-profile", "camel")).toBe("UserProfile");
    });

    it("should use pascalCase for pascal naming", () => {
      expect(getTypeName("user_profile", "pascal")).toBe("UserProfile");
      expect(getTypeName("UserProfile", "pascal")).toBe("UserProfile");
      expect(getTypeName("user-profile", "pascal")).toBe("UserProfile");
    });

    it("should use pascalCase for kebab naming", () => {
      expect(getTypeName("user_profile", "kebab")).toBe("UserProfile");
      expect(getTypeName("UserProfile", "kebab")).toBe("UserProfile");
      expect(getTypeName("user-profile", "kebab")).toBe("UserProfile");
    });

    it("should keep original for original naming", () => {
      expect(getTypeName("user_profile", "original")).toBe("user_profile");
      expect(getTypeName("UserProfile", "original")).toBe("UserProfile");
      expect(getTypeName("user-profile", "original")).toBe("user-profile");
    });

    it("should handle single word", () => {
      expect(getTypeName("user", "camel")).toBe("User");
      expect(getTypeName("User", "camel")).toBe("User");
    });

    it("should handle acronyms", () => {
      expect(getTypeName("user_id", "camel")).toBe("UserId");
      expect(getTypeName("xml_parser", "camel")).toBe("XmlParser");
    });
  });

  describe("getSchemaName", () => {
    it("should use camelCase + Schema for camel naming", () => {
      expect(getSchemaName("user_profile", "camel")).toBe("UserProfileSchema");
      expect(getSchemaName("UserProfile", "camel")).toBe("UserProfileSchema");
      expect(getSchemaName("user-profile", "camel")).toBe("UserProfileSchema");
    });

    it("should use pascalCase + Schema for pascal naming", () => {
      expect(getSchemaName("user_profile", "pascal")).toBe("UserProfileSchema");
      expect(getSchemaName("UserProfile", "pascal")).toBe("UserProfileSchema");
      expect(getSchemaName("user-profile", "pascal")).toBe("UserProfileSchema");
    });

    it("should use camelCase + Schema for kebab naming", () => {
      expect(getSchemaName("user_profile", "kebab")).toBe("UserProfileSchema");
      expect(getSchemaName("UserProfile", "kebab")).toBe("UserProfileSchema");
      expect(getSchemaName("user-profile", "kebab")).toBe("UserProfileSchema");
    });

    it("should keep original + Schema for original naming", () => {
      expect(getSchemaName("user_profile", "original")).toBe(
        "user_profileSchema",
      );
      expect(getSchemaName("UserProfile", "original")).toBe(
        "UserProfileSchema",
      );
      expect(getSchemaName("user-profile", "original")).toBe(
        "user-profileSchema",
      );
    });

    it("should handle single word", () => {
      expect(getSchemaName("user", "camel")).toBe("UserSchema");
      expect(getSchemaName("User", "camel")).toBe("UserSchema");
      expect(getSchemaName("user", "pascal")).toBe("UserSchema");
    });

    it("should handle already suffixed names", () => {
      expect(getSchemaName("userSchema", "camel")).toBe("UserSchemaSchema");
      expect(getSchemaName("user_schema", "camel")).toBe("UserSchemaSchema");
    });
  });

  describe("Consistency between naming functions", () => {
    it("should maintain consistent naming across functions for camel convention", () => {
      const name = "user_profile";

      const fieldName = applyNaming(name, "camel");
      const typeName = getTypeName(name, "camel");
      const schemaName = getSchemaName(name, "camel");

      expect(fieldName).toBe("userProfile");
      expect(typeName).toBe("UserProfile");
      expect(schemaName).toBe("UserProfileSchema");
    });

    it("should maintain consistent naming across functions for pascal convention", () => {
      const name = "user_profile";

      const fieldName = applyNaming(name, "pascal");
      const typeName = getTypeName(name, "pascal");
      const schemaName = getSchemaName(name, "pascal");

      expect(fieldName).toBe("UserProfile");
      expect(typeName).toBe("UserProfile");
      expect(schemaName).toBe("UserProfileSchema");
    });

    it("should maintain consistent naming across functions for original convention", () => {
      const name = "user_profile";

      const fieldName = applyNaming(name, "original");
      const typeName = getTypeName(name, "original");
      const schemaName = getSchemaName(name, "original");

      expect(fieldName).toBe("user_profile");
      expect(typeName).toBe("user_profile");
      expect(schemaName).toBe("user_profileSchema");
    });
  });
});
