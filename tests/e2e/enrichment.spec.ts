import { test, expect } from '@playwright/test';
import { hasTestUser } from '../helpers/auth';
import { fillControlledInput } from '../helpers/dom';
import apolloSearchFacebookFixture from '../fixtures/apollo-search-facebook.json';
import enrichmentResultFixture from '../fixtures/enrichment-result.json';

const facebookOrg = apolloSearchFacebookFixture.organizations[0];
const { enrichment, lead_id: leadId, company_id: companyId } = enrichmentResultFixture;

const savedLeadRow = {
  id: leadId,
  company_id: companyId,
  lead_score: enrichment.lead_score,
  icp_fit: enrichment.icp_fit,
  outreach_angle: enrichment.outreach_angle,
  status: 'new',
  ai_summary: enrichment.ai_summary,
  signals: enrichment.signals,
  concerns: enrichment.concerns,
  created_at: new Date().toISOString(),
  company: {
    id: companyId,
    apollo_id: facebookOrg.id,
    name: facebookOrg.name,
    domain: 'www.facebook.com',
    industry: facebookOrg.industry,
    employee_count: facebookOrg.estimated_num_employees,
    country: facebookOrg.country,
    city: facebookOrg.city,
    linkedin_url: facebookOrg.linkedin_url,
    raw_apollo: null,
    created_at: new Date().toISOString(),
  },
};

test.describe('enrichment', () => {
  test.beforeEach(() => {
    test.skip(
      !hasTestUser(),
      'TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test'
    );
  });

  test('search, enrich, save, and see the lead on /leads', async ({ page }) => {
    let enrichRequestBody: unknown;

    await page.route('**/functions/v1/apollo-search', async (route) => {
      await route.fulfill({ json: apolloSearchFacebookFixture });
    });

    await page.route('**/functions/v1/save-enriched-lead', async (route) => {
      enrichRequestBody = route.request().postDataJSON();
      await route.fulfill({ json: enrichmentResultFixture });
    });

    await page.route('**/rest/v1/leads*', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      await route.fulfill({ json: [savedLeadRow] });
    });

    // Search
    await page.goto('/search');
    await fillControlledInput(page.getByPlaceholder('SEARCH BY COMPANY NAME'), 'Facebook');
    await page.getByRole('button', { name: 'EXECUTE' }).click();
    await expect(page.getByRole('heading', { name: 'Facebook', exact: true })).toBeVisible();

    // Enrich + save (one action in this UI)
    await page.getByRole('button', { name: '+ ENRICH' }).click();
    await expect(page.getByRole('button', { name: 'SAVED' })).toBeVisible();

    const { org: enrichedOrg } = enrichRequestBody as { org: { id: string; name: string } };
    expect(enrichedOrg.id).toBe(facebookOrg.id);
    expect(enrichedOrg.name).toBe('Facebook');

    // Confirm it shows up on /leads with the enriched data intact
    await page.goto('/leads');
    await expect(page.getByRole('heading', { name: 'Facebook', exact: true })).toBeVisible();
    await expect(page.getByTitle(`Score: ${enrichment.lead_score}/100`)).toBeVisible();
    await expect(page.getByText('HIGH', { exact: true })).toBeVisible();
    await expect(page.getByText(enrichment.ai_summary)).toBeVisible();
    await expect(page.getByText(enrichment.signals[0])).toBeVisible();
    await expect(page.getByText(enrichment.outreach_angle)).toBeVisible();
  });
});
