import {
    LightdashInstallType,
    OrganizationMemberRole,
    ProjectType,
    RequestMethod,
    WarehouseTypes,
} from '@lightdash/common';
import { analyticsMock } from '../../analytics/LightdashAnalytics.mock';
import { lightdashConfigMock } from '../../config/lightdashConfig.mock';
import { GroupsModel } from '../../models/GroupsModel';
import { InviteLinkModel } from '../../models/InviteLinkModel';
import { OnboardingModel } from '../../models/OnboardingModel/OnboardingModel';
import { OrganizationAllowedEmailDomainsModel } from '../../models/OrganizationAllowedEmailDomainsModel';
import { OrganizationMemberProfileModel } from '../../models/OrganizationMemberProfileModel';
import { OrganizationModel } from '../../models/OrganizationModel';
import { ProjectModel } from '../../models/ProjectModel/ProjectModel';
import { UserModel } from '../../models/UserModel';
import { ServiceRepository } from '../../services/ServiceRepository';
import { OrganizationService } from './OrganizationService';
import { organization, user } from './OrganizationService.mock';

const projectModel = {
    hasProjects: jest.fn(async () => true),
};
const organizationModel = {
    get: jest.fn(async () => organization),
    create: jest.fn(async () => organization),
    hasOrgs: jest.fn(async () => false),
};
const userModel = {
    hasUsers: jest.fn(async () => false),
    joinOrg: jest.fn(async () => {}),
};

const mockProjectService = {
    createWithoutCompile: jest.fn(async () => ({
        projectUuid: 'test-project-uuid',
    })),
};

const mockServiceRepository = {
    getProjectService: jest.fn(() => mockProjectService),
} as unknown as ServiceRepository;

describe('organization service', () => {
    const organizationService = new OrganizationService({
        lightdashConfig: lightdashConfigMock,
        analytics: analyticsMock,
        organizationModel: organizationModel as unknown as OrganizationModel,
        projectModel: projectModel as unknown as ProjectModel,
        onboardingModel: {} as OnboardingModel,
        inviteLinkModel: {} as InviteLinkModel,
        organizationMemberProfileModel: {} as OrganizationMemberProfileModel,
        userModel: userModel as unknown as UserModel,
        organizationAllowedEmailDomainsModel:
            {} as OrganizationAllowedEmailDomainsModel,
        groupsModel: {} as GroupsModel,
        services: mockServiceRepository,
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    beforeEach(() => {
        process.env = {
            LIGHTDASH_INSTALL_TYPE: LightdashInstallType.UNKNOWN,
        };
    });

    it('Should return needsProject false if there are projects in DB', async () => {
        expect(await organizationService.get(user)).toEqual({
            ...organization,
            needsProject: false,
        });
    });
    it('Should return needsProject true if there are no projects in DB', async () => {
        (projectModel.hasProjects as jest.Mock).mockImplementationOnce(
            async () => false,
        );
        expect(await organizationService.get(user)).toEqual({
            ...organization,
            needsProject: true,
        });
    });

    describe('createAndJoinOrg', () => {
        it('should create organization, join user as admin, and create first project', async () => {
            const orgData = { name: 'Test Org' };

            await organizationService.createAndJoinOrg(user, orgData);

            // Verify organization creation
            expect(organizationModel.create).toHaveBeenCalledWith(orgData);

            // Verify user joined as admin
            expect(userModel.joinOrg).toHaveBeenCalledWith(
                user.userUuid,
                organization.organizationUuid,
                OrganizationMemberRole.ADMIN,
                undefined,
            );

            // Verify project creation
            expect(
                mockProjectService.createWithoutCompile,
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...user,
                    organizationUuid: organization.organizationUuid,
                }),
                expect.objectContaining({
                    name: 'My first project',
                    type: ProjectType.DEFAULT,
                    warehouseConnection: expect.objectContaining({
                        type: WarehouseTypes.BIGQUERY,
                    }),
                }),
                RequestMethod.WEB_APP,
            );

            // Verify analytics tracking
            expect(analyticsMock.track).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: 'organization.created',
                    userId: user.userUuid,
                }),
            );
            expect(analyticsMock.track).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: 'user.joined_organization',
                    userId: user.userUuid,
                }),
            );
        });
    });
});
