import { OrganizationMemberRole } from '@lightdash/common';
import {
    ActionIcon,
    Avatar,
    Box,
    Button,
    Card,
    Group,
    Modal,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { IconSearch, IconTrash, IconUserPlus } from '@tabler/icons-react';
import React, { useEffect, useState } from 'react';
import useApp from '../../../providers/App/useApp';
import InviteUserModal from '../../modals/InviteUserModal';
import { InviteUserData } from '../../models/interfaces';
import { apiService } from '../../services/api';
import { notificationService } from '../../services/notification.service';

interface TeamMember {
    key: string;
    name: string;
    email: string;
    role: string;
    avatar: string;
}

const Team: React.FC = () => {
    const { user } = useApp();
    const [loading, setLoading] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [searchText, setSearchText] = useState('');
    const [isInviteUserVisible, setIsInviteUserVisible] = useState(false);

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    const fetchTeamMembers = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAllApplicationUsers();
            const formattedMembers: TeamMember[] = response.map(
                (user: any) => ({
                    key: user.userId,
                    name: user.name,
                    email: user.email,
                    role: user.role || 'user',
                    avatar: user.name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase(),
                }),
            );
            setTeamMembers(formattedMembers);
        } catch (error) {
            console.error('Failed to fetch team members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (
        userId: string,
        newRole: string,
        currentRole: string,
    ) => {
        if (currentRole === OrganizationMemberRole.ADMIN) {
            notificationService.showErrorNotification(
                'Cannot modify owner role',
                'The role of an owner cannot be changed',
            );
            return;
        }

        if (user.data?.role != OrganizationMemberRole.ADMIN) {
            notificationService.showErrorNotification(
                'Unauthorized',
                'Only owners can modify user roles',
            );
            return;
        }

        try {
            setLoading(true);
            await apiService.updateUserRole(userId, newRole);

            setTeamMembers((prevMembers) =>
                prevMembers.map((member) =>
                    member.key === userId
                        ? { ...member, role: newRole }
                        : member,
                ),
            );
            notificationService.showSuccessNotification(
                '',
                'User role updated successfully',
            );
        } catch (error) {
            console.error('Failed to update user role:', error);
            notificationService.showErrorNotification(
                'Failed to update role',
                'An error occurred while updating the user role',
            );
        } finally {
            setLoading(false);
        }
    };

    const handleInviteUser = async (values: InviteUserData) => {
        try {
            await apiService.inviteUser(values);
            notificationService.showSuccessNotification(
                'User invited successfully',
                'An email has been sent to set up their password',
            );
        } catch (error) {
            console.error('Failed to invite user:', error);
            notificationService.showErrorNotification(
                'Failed to invite user',
                error instanceof Error
                    ? error.message
                    : 'An unknown error occurred',
            );
        }
    };

    const filteredTeamMembers = teamMembers.filter((member) => {
        const searchLower = searchText.toLowerCase();
        return (
            member.name.toLowerCase().includes(searchLower) ||
            member.email.toLowerCase().includes(searchLower)
        );
    });

    const rows = filteredTeamMembers.map((member) => (
        <tr key={member.key}>
            <td>
                <Group>
                    <Avatar color="blue" radius="xl" size="md">
                        {member.avatar}
                    </Avatar>
                    <Text>{member.name}</Text>
                </Group>
            </td>
            <td>
                <Text c="dimmed">{member.email}</Text>
            </td>
            <td>
                <Select
                    value={member.role}
                    onChange={(value) =>
                        handleRoleChange(member.key, value || '', member.role)
                    }
                    disabled={
                        member.role === 'owner' ||
                        user.data?.role !== OrganizationMemberRole.ADMIN
                    }
                    data={[
                        { value: 'owner', label: 'Owner' },
                        { value: 'admin', label: 'Admin' },
                        { value: 'user', label: 'User' },
                    ]}
                />
            </td>
            <td>
                <ActionIcon variant="subtle" color="red">
                    <IconTrash size={16} />
                </ActionIcon>
            </td>
        </tr>
    ));

    return (
        <Box p="xl">
            <Stack mb="xl">
                <Title order={2}>Team Members</Title>
                <Text c="dimmed">Manage your team members and their roles</Text>
            </Stack>

            <Card withBorder>
                <Stack>
                    <Group position="apart">
                        <TextInput
                            placeholder="Search members..."
                            icon={<IconSearch size={16} />}
                            value={searchText}
                            onChange={(e) =>
                                setSearchText(e.currentTarget.value)
                            }
                            style={{ width: 300 }}
                            rightSectionWidth={32}
                        />
                        <Button
                            leftIcon={<IconUserPlus size={16} />}
                            onClick={() => setIsInviteUserVisible(true)}
                        >
                            Add Team Member
                        </Button>
                    </Group>

                    <Table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>{rows}</tbody>
                    </Table>
                </Stack>
            </Card>

            <Modal
                opened={isInviteUserVisible}
                onClose={() => setIsInviteUserVisible(false)}
                title="Invite Team Member"
            >
                <InviteUserModal
                    opened={isInviteUserVisible}
                    onClose={() => setIsInviteUserVisible(false)}
                    onSubmit={handleInviteUser}
                />
            </Modal>
        </Box>
    );
};

export default Team;
